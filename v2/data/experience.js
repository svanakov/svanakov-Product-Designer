// Опыт и навыки. Данные из CV (кратко: у каждого места два самых сильных результата).
export const experience = [
  {
    period: { ru: 'сен 2025 – июн 2026', en: 'Sep 2025 – Jun 2026' },
    company: { ru: 'Дэш', en: 'Dash' },
    role: { ru: 'Product Designer', en: 'Product Designer' },
    domain: { ru: 'EdTech, AI-платформа для учителей', en: 'EdTech, AI platform for teachers' },
    results: [
      { ru: 'Спроектировал ключевые сценарии: генерация и редактирование теста, проверка и аналитика по классу', en: 'Designed the key flows: test generation and editing, grading and class analytics' },
      { ru: 'Собрал дизайн-систему, ускорив сборку интерфейсов', en: 'Built a design system that sped up interface assembly' },
    ],
  },
  {
    period: { ru: 'янв 2025 – сен 2025', en: 'Jan 2025 – Sep 2025' },
    company: { ru: 'Би-Би', en: 'Bi-Bi' },
    role: { ru: 'UX/UI Designer', en: 'UX/UI Designer' },
    domain: { ru: 'E-commerce, магазин автозапчастей', en: 'E-commerce, auto parts store' },
    results: [
      { ru: 'Поднял конверсию в покупку на 20% и сократил время поиска товара на 27%', en: 'Raised purchase conversion by 20% and cut product search time by 27%' },
      { ru: 'Сократил путь от поиска до заказа на два шага', en: 'Cut the path from search to order by two steps' },
    ],
  },
  {
    period: { ru: 'июн 2024 – дек 2024', en: 'Jun 2024 – Dec 2024' },
    company: { ru: 'Правильная стоматология', en: 'Pravilnaya Stomatologiya' },
    role: { ru: 'UX/UI Designer', en: 'UX/UI Designer' },
    domain: { ru: 'MedTech', en: 'MedTech' },
    results: [
      { ru: 'Вместе с командой поднял конверсию в заявку с 1,2% до 3,8%', en: 'With the team raised lead conversion from 1.2% to 3.8%' },
      { ru: 'Сократил форму записи с восьми полей до двух', en: 'Cut the booking form from eight fields to two' },
    ],
  },
];

// Правый блок: навыки по группам.
export const stack = [
  { title: { ru: 'Исследования', en: 'Research' }, items: [
    { ru: 'Глубинные интервью', en: 'In-depth interviews' }, { ru: 'Юзабилити-тесты', en: 'Usability tests' }, 'A/B', 'CJM', 'JTBD',
    { ru: 'Анализ конкурентов', en: 'Competitor analysis' }, { ru: 'Яндекс Метрика', en: 'Yandex Metrika' },
  ] },
  { title: { ru: 'Проектирование', en: 'Design' }, items: [
    'UX/UI', { ru: 'Информационная архитектура', en: 'Information architecture' }, 'User Flows',
    { ru: 'Прототипирование', en: 'Prototyping' }, { ru: 'Мобильные приложения', en: 'Mobile apps' }, { ru: 'Адаптивный веб', en: 'Responsive web' },
  ] },
  { title: { ru: 'Системы и процессы', en: 'Systems and process' }, items: [
    { ru: 'Дизайн-системы', en: 'Design systems' }, { ru: 'UI-киты', en: 'UI kits' }, { ru: 'Дизайн-ревью', en: 'Design review' },
    { ru: 'Передача в разработку', en: 'Developer handoff' },
  ] },
  { title: { ru: 'Инструменты', en: 'Tools' }, items: ['Figma', 'Figma AI', 'Tilda', 'HTML/CSS'] },
  { title: { ru: 'Языки', en: 'Languages' }, plain: true, items: [{ ru: 'Русский (родной), английский (B2)', en: 'Russian (native), English (B2)' }] },
];
