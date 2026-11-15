// Данные карточек кейсов на главной. Порядок = порядок на странице (сильнейший кейс первым).
// kind: 'concept' (личный проект / концепт) | 'real' (реальный клиент).
// resultNote: чем подкреплён результат (честная пометка).
export const cases = [
  {
    slug: 'rytmo',
    href: './rytmo.html',
    title: { ru: 'Rytmo', en: 'Rytmo' },
    domain: { ru: 'Мобильное фитнес-приложение', en: 'Mobile fitness app' },
    kind: 'concept',
    problem: {
      ru: 'Люди бросают тренировки на 2–3 неделе, до появления привычки и первого результата.',
      en: 'People quit working out in week 2–3, before the habit and the first results kick in.',
    },
    result: {
      ru: '11 из 12 участников теста с первого клика нашли рекомендованную тренировку (92%).',
      en: '11 out of 12 test participants found the recommended workout with their first click (92%).',
    },
    resultNote: { ru: 'результат теста прототипа', en: 'prototype test result' },
    cover: '../uploads/rytmo-cover.webp',
    tags: ['Mobile', 'UX Research', 'Product Design', 'Prototyping'],
  },
  {
    slug: 'campus',
    href: './campus.html',
    title: { ru: 'Campus', en: 'Campus' },
    domain: { ru: 'PWA с расписанием вуза', en: 'University schedule PWA' },
    kind: 'concept',
    problem: {
      ru: 'Официальное приложение вуза вылетает и не открывается без интернета, когда срочно нужно расписание.',
      en: 'The official university app crashes and does not work offline just when you need the schedule.',
    },
    // TODO: цифры по Campus нет, только обратная связь знакомых.
    result: {
      ru: 'Расписание работает офлайн. Пользуюсь сам и делюсь с одногруппниками.',
      en: 'The schedule works offline. I use it myself and share it with classmates.',
    },
    resultNote: { ru: 'отзывы знакомых, не метрики', en: 'feedback from peers, not metrics' },
    cover: '../uploads/campus-cover.webp',
    tags: ['PWA', 'UI Design', 'EdTech'],
  },
  {
    slug: 'dispatch',
    href: './dispatch.html',
    title: { ru: 'Диспетчерская консоль курьерской компании', en: 'Dispatcher Console for a Courier Company' },
    domain: { ru: 'B2B, курьерская доставка', en: 'B2B, courier delivery' },
    kind: 'concept',
    problem: {
      ru: 'При 100+ заказах в день диспетчер не справляется с таблицей, а срывы SLA замечает постфактум.',
      en: 'At 100+ orders a day a dispatcher cannot keep up with a spreadsheet and notices SLA breaches too late.',
    },
    result: {
      ru: 'Макет закрывает все 7 задач диспетчера. 15 звонков при сбое заменяются одним массовым действием.',
      en: 'The design covers all 7 dispatcher jobs. 15 calls after a failure become one bulk action.',
    },
    resultNote: { ru: 'оценка, не измерено', en: 'estimate, not measured' },
    cover: '../uploads/dispatch-cover.webp',
    tags: ['UX Research', 'Product Design'],
  },
];
