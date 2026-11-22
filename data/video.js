// Видео «Figma → код с ИИ». Пока файла нет: src = null, модалка показывает заглушку.
// Положите mp4 (H.264) в media/ и впишите пути. Не YouTube как единственный источник.
export const video = {
  src: './media/figma-to-code.mp4',          // полное видео со звуком, например './media/figma-to-code.mp4'
  previewSrc: './media/preview.mp4',   // беззвучный короткий фрагмент для блока «Как я работаю», например './media/preview.mp4'
  poster: './uploads/video-poster3.webp', // обложка блока и видео
  minutes: 4,      // длительность для чипа в Hero, например 4
  subtitles: { ru: './media/subs-ru.vtt', en: './media/subs-en.vtt' }, // дорожки субтитров (WebVTT)
};
