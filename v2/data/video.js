// Видео «Figma → код с ИИ». Пока файла нет: src = null, модалка показывает заглушку.
// Положите mp4 (H.264) в v2/media/ и впишите пути. Не YouTube как единственный источник.
export const video = {
  src: null,          // полное видео со звуком, например './media/figma-to-code.mp4'
  previewSrc: null,   // беззвучный короткий фрагмент для блока «Как я работаю», например './media/preview.mp4'
  poster: '../uploads/video-poster2.webp', // обложка блока и видео
  minutes: null,      // длительность для чипа в Hero, например 4
  subtitles: { ru: null, en: null }, // .vtt, например './media/subs-ru.vtt'
};
