#!/usr/bin/env python3
"""Локальный сервер для разработки: как `python3 -m http.server`, но с отключённым кэшем.
Без этого браузер держит старые модули (home.js, data/*.js) и после правок часть блоков пропадает.

Запуск из папки проекта:  python3 scripts/dev-server.py 5511
"""
import os
import sys
import urllib.error
import urllib.request
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

# Локально бэкенда нет (он живёт на Vercel), поэтому запросы ассистента уходят на боевой /api/chat.
# Ключ доступа берётся из запроса (?assistant=КЛЮЧ), в файлах он не хранится.
PROD = "https://svanakov.vercel.app"


class NoCacheHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path.split("?")[0] != "/api/chat":
            self.send_error(404)
            return
        body = self.rfile.read(int(self.headers.get("Content-Length") or 0))
        headers = {"Content-Type": "application/json", "Origin": PROD}
        if self.headers.get("x-assistant-key"):
            headers["x-assistant-key"] = self.headers["x-assistant-key"]
        req = urllib.request.Request(PROD + "/api/chat", data=body, headers=headers, method="POST")
        try:
            resp = urllib.request.urlopen(req, timeout=60)
        except urllib.error.HTTPError as e:
            resp = e
        except Exception as e:  # нет сети и т.п.
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(('{"error":"proxy_%s"}' % type(e).__name__).encode())
            return
        self.send_response(resp.status if hasattr(resp, "status") else resp.code)
        self.send_header("Content-Type", resp.headers.get("Content-Type", "text/plain"))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        try:
            while True:
                chunk = resp.read(64)
                if not chunk:
                    break
                self.wfile.write(chunk)
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5511
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # корень проекта, откуда бы ни запустили
    handler = partial(NoCacheHandler, directory=root)
    print(f"http://localhost:{port}/  (кэш выключен, Ctrl+C для остановки)")
    ThreadingHTTPServer(("", port), handler).serve_forever()
