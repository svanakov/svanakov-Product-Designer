// Данные карточек кейсов на главной. Порядок = порядок на странице (сильнейший кейс первым).
// Структура карточки: название, платформа и стек, проблема, результат. Тексты короткие.
// kind: 'concept' (личный проект) | 'real' (реальный клиент). resultNote: чем подкреплён результат (честная пометка).
export const cases = [
  {
    slug: 'rytmo',
    href: './rytmo.html',
    title: { ru: 'Rytmo', en: 'Rytmo' },
    platform: { ru: 'Мобильное приложение', en: 'Mobile app' },
    stack: ['Mobile', 'UX Research', 'Product Design', 'Prototyping'],
    kind: 'concept',
    problem: {
      ru: 'Люди бросают тренировки на 2–3 неделе, до первого результата.',
      en: 'People quit working out in week 2–3, before the first results.',
    },
    result: [
      { ru: '11 из 12 участников (92%) первым кликом попали на рекомендуемую тренировку.', en: '11 of 12 participants (92%) landed on the recommended workout with their first click.' },
      { ru: 'Средний SEQ по трём сценариям: 6.2 из 7.', en: 'Average SEQ across the three scenarios: 6.2 out of 7.' },
    ],
    cover: '../uploads/rytmo-cover2.webp?v=3',
  },
  {
    slug: 'campus',
    href: './campus.html',
    title: { ru: 'Campus', en: 'Campus' },
    platform: { ru: 'Веб, PWA', en: 'Web, PWA' },
    stack: ['PWA', 'UI Design', 'EdTech'],
    kind: 'concept',
    problem: {
      ru: 'Приложение вуза вылетает и не работает без интернета.',
      en: 'The university app crashes and does not work offline.',
    },
    // TODO: цифр по Campus нет, только обратная связь знакомых.
    result: {
      ru: 'Расписание работает офлайн, пользуются одногруппники.',
      en: 'The schedule works offline, classmates use it.',
    },
    cover: '../uploads/campus-cover2.webp?v=2',
  },
  {
    slug: 'dispatch',
    href: './dispatch.html',
    title: { ru: 'Диспетчерская консоль курьерской компании', en: 'Dispatcher Console for a Courier Company' },
    platform: { ru: 'Веб, B2B', en: 'Web, B2B' },
    stack: ['UX Research', 'Product Design'],
    kind: 'concept',
    problem: {
      ru: 'При 100+ заказах в день таблица не справляется, срывы SLA видны постфактум.',
      en: 'At 100+ orders a day a spreadsheet cannot keep up, SLA breaches are seen too late.',
    },
    result: {
      ru: '15 звонков при сбое заменяются одним массовым действием.',
      en: '15 calls after a failure become one bulk action.',
    },
    cover: '../uploads/dispatch-cover2.webp?v=2',
  },
];
