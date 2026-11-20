// Галереи экранов для страниц кейсов. Ключ = значение data-gallery на странице.
// Файлы лежат в uploads/gallery/<папка>/NN.webp. Порядок в массиве = порядок показа.
// w/h: размеры картинки, чтобы страница не прыгала при загрузке.
const P = (dir, w, h, items) => items.map(([n, ru, en]) => ({ src: `./uploads/gallery/${dir}/${String(n).padStart(2, '0')}.webp`, w, h, cap: { ru, en } }));

export const gallery = {
  'rytmo-first': {
    groups: [
      { title: { ru: 'Первый запуск', en: 'First launch' }, items: P('rytmo-first', 440, 956, [
        [1, 'Регистрация', 'Sign up'],
        [2, 'Онбординг: выбор цели', 'Onboarding: goal selection'],
        [3, 'Главная: прогресс недели', 'Home: week progress'],
        [4, 'Тренировка: план', 'Workout: plan'],
        [5, 'Плеер тренировки', 'Workout player'],
        [6, 'Выход из тренировки', 'Leaving a workout'],
        [7, 'Первая тренировка завершена', 'First workout completed'],
      ]) },
    ],
  },
  'rytmo-return': {
    groups: [
      { title: { ru: 'Возврат после пропуска', en: 'Return after a miss' }, items: P('rytmo-return', 440, 956, [
        [1, 'Напоминание на экране блокировки', 'Reminder on the lock screen'],
        [2, 'Главная: серия заморожена', 'Home: streak frozen'],
        [3, 'Короткая тренировка', 'A short workout'],
        [4, 'Серия сохранена', 'Streak saved'],
        [5, 'Главная: серия продолжается', 'Home: streak continues'],
      ]) },
    ],
  },
  'rytmo-repeat': {
    groups: [
      { title: { ru: 'Повторный визит', en: 'Repeat visit' }, items: P('rytmo-repeat', 440, 956, [
        [1, 'Виджет на домашнем экране', 'Home screen widget'],
        [2, 'Напоминание', 'Reminder'],
        [3, 'Главная: прогресс недели', 'Home: week progress'],
        [4, 'Главная: цель недели выполнена', 'Home: weekly goal reached'],
        [5, 'Активность: история и награды', 'Activity: history and rewards'],
        [6, 'Программа', 'Program'],
        [7, 'Программа завершена', 'Program completed'],
      ]) },
    ],
  },
  campus: {
    groups: [
      { title: { ru: 'Экраны', en: 'Screens' }, items: P('campus', 393, 852, [
        [1, 'Знакомство с приложением', 'Introduction'],
        [2, 'Главный экран: сейчас и дальше', 'Home: now and next'],
        [3, 'Расписание на неделю', 'Weekly schedule'],
        [4, 'Реакции на пару', 'Reactions to a class'],
        [5, 'Настройки', 'Settings'],
        [6, 'Подключение Кампус Про', 'Connecting Campus Pro'],
      ]) },
    ],
  },
};
