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
    cover: './uploads/rytmo-cover5.webp',
    tagline: { ru: 'Нашёл, почему люди бросают фитнес на 2–3 неделе, и собрал приложение, где 92% с первого клика попадают на нужную тренировку', en: 'Found why people quit fitness in week 2–3 and built an app where 92% reach the right workout with their first click' },
    // year: '2025', // год проекта: покажется рядом с названием
    blurb: { ru: 'Почему люди бросают фитнес-приложения на 2–3 неделе — и как удержать их до появления привычки', en: 'Why people abandon fitness apps in week 2–3 — and how to keep them until the habit sticks' },
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
    cover: './uploads/campus-cover5.webp',
    tagline: { ru: 'Заменил вылетающее приложение вуза своим PWA, которое показывает расписание без интернета', en: 'Replaced the crashing university app with my own PWA that shows the schedule offline' },
    // year: '2025', // год проекта: покажется рядом с названием
    blurb: { ru: 'Разработка своего приложения с расписанием пар в виде PWA. Офлайн-доступ вместо вылетающего официального приложения.', en: 'Built my own class-schedule app as a PWA. Offline access instead of a crashing official app.' },
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
    cover: './uploads/dispatch-cover5.webp',
    tagline: { ru: 'Заменил таблицу в курьерской службе консолью, где 15 звонков при сбое превращаются в одно действие', en: 'Replaced a spreadsheet at a courier company with a console where 15 calls after a failure become one action' },
    // year: '2025', // год проекта: покажется рядом с названием
    blurb: { ru: 'B2B-сервис курьерской доставки вырос до 100+ заказов в день — ручное отслеживание в таблице перестало справляться. Проектирую видимость риска по SLA и приоритизацию исключений.', en: 'A B2B courier service grew past 100+ orders a day — manual tracking in a spreadsheet stopped working. Designing SLA risk visibility and exception prioritization.' },
  },
  {
    slug: 'vpnmini',
    worksOnly: true,
    soon: true, // кейс пока не готов: карточка не кликается, при наведении метка «Скоро»
    href: './vpnmini.html',
    title: { ru: 'Telegram Mini App для VPN-сервиса', en: 'Telegram Mini App for a VPN Service' },
    stack: ['Mobile', 'UX Research', 'Product Design'],
    kind: 'concept',
    tagline: { ru: 'Перенёс управление VPN и подпиской внутрь Telegram', en: 'Moved VPN and subscription management inside Telegram' },
    // year: '2025', // год проекта: покажется рядом с названием
    blurb: { ru: 'Управление личным VPN и подпиской прямо внутри Telegram.', en: 'Managing a personal VPN and its subscription entirely inside Telegram.' },
    cover: './uploads/vpnmini-cover5.webp',
  },
  {
    slug: 'jobs-screen',
    worksOnly: true, // показывается только на странице «Все кейсы», на главной нет
    href: './jobs-screen.html',
    soon: true, // страницы кейса пока нет: карточка не кликается, при наведении метка «Скоро»
    title: { ru: 'Редизайн главного экрана вакансий платформы объявлений', en: 'Redesign of a Classifieds Platform’s Jobs Home Screen' },
    platform: { ru: 'Мобильное приложение, iOS', en: 'Mobile app, iOS' },
    stack: ['Mobile', 'UX Research', 'Product Design', 'Prototyping'],
    kind: 'concept',
    problem: {
      ru: 'Главный экран вакансий одинаков для новичка и для того, кто ищет месяцами: ключевые действия теряются, причины вернуться нет.',
      en: 'The jobs home screen looks the same for a newcomer and for someone searching for months: key actions get lost and there is no reason to come back.',
    },
    result: {
      ru: 'Три решения из четырёх на проверке с тремя респондентами понятны без доработок.',
      en: 'Three of four solutions were clear without rework when checked with three respondents.',
    },
    // cover: './uploads/jobs-cover.webp', // положить обложку 16:9 в uploads и раскомментировать
    tagline: { ru: 'Разобрал главный экран вакансий платформы объявлений и предложил, как быстрее вести к отклику и возвращать соискателей: 3 из 4 решений понятны без доработок', en: 'Analyzed the jobs home screen of a classifieds platform and proposed how to lead to an application faster and bring job seekers back: 3 of 4 solutions were clear without rework' },
    blurb: { ru: 'Разбор аудитории и главного экрана вакансий платформы объявлений: сегменты, интервью, гипотезы, прототипы и проверка на трёх респондентах.', en: 'A study of the audience and the jobs home screen of a classifieds platform: segments, interviews, hypotheses, prototypes and a check with three respondents.' },
  },
  // Показывается только на странице «Кейсы и работы», на главной его нет.
];
