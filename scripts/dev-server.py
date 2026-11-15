#!/usr/bin/env python3
"""Локальный сервер для разработки: как `python3 -m http.server`, но с отключённым кэшем.
Без этого браузер держит старые модули (home.js, data/*.js) и после правок часть блоков пропадает.

Запуск из папки проекта:  python3 scripts/dev-server.py 5511
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5511
    handler = partial(NoCacheHandler, directory=".")
    print(f"http://localhost:{port}/v2/index.html  (кэш выключен, Ctrl+C для остановки)")
    ThreadingHTTPServer(("", port), handler).serve_forever()
