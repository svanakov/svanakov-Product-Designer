// Опыт работы. Данные из резюме (content/assistant/experience.md), порядок: от новых мест к старым.
export const experience = [
  {
    period: { ru: 'сен 2025 – июн 2026', en: 'Sep 2025 – Jun 2026' },
    company: { ru: 'Дэш', en: 'Dash' },
    icon: 'cap', hue: 275, // иконка сферы и оттенок градиента плитки
    role: { ru: 'Product Designer', en: 'Product Designer' },
    domain: { ru: 'EdTech, AI-платформа для учителей', en: 'EdTech, AI platform for teachers' },
    results: [
      { ru: 'Определил ключевой барьер пользователей: провёл исследование конкурентов, интервью и опросы', en: 'Identified the key user barrier through competitor research, interviews and surveys' },
      { ru: 'Вместе с разработчиками продумал механику проверки работ: ИИ показывает уверенность в оценке, спорные ответы уходят на ручной разбор, оценку можно поправить в один клик', en: 'Worked out the grading mechanics with developers: the AI shows its confidence, disputed answers go to manual review, a grade can be fixed in one click' },
      { ru: 'Спроектировал ключевые сценарии: генерация и редактирование теста, проведение самостоятельных и контрольных, проверка и аналитика по классу', en: 'Designed the key flows: test generation and editing, running quizzes and exams, grading and class analytics' },
      { ru: 'Тестировал прототипы на репетиторах и студентах, чтобы снизить риски до разработки', en: 'Tested prototypes with tutors and students to reduce risk before development' },
      { ru: 'Собрал дизайн-систему, ускорив сборку интерфейсов: ей пользуются ещё один дизайнер и разработчик', en: 'Built a design system that sped up interface assembly; another designer and a developer use it' },
      { ru: 'Готовил визуальные материалы к запуску: посты, рекламные креативы, промо для сообществ учителей', en: 'Prepared launch visuals: posts, ad creatives and promo for teacher communities' },
    ],
  },
  {
    period: { ru: 'янв 2025 – сен 2025', en: 'Jan 2025 – Sep 2025' },
    company: { ru: 'Би-Би', en: 'Bi-Bi' },
    icon: 'cart', hue: 45, // иконка сферы и оттенок градиента плитки
    role: { ru: 'UX/UI Designer', en: 'UX/UI Designer' },
    domain: { ru: 'E-commerce, интернет-магазин автозапчастей', en: 'E-commerce, auto parts store' },
    results: [
      { ru: 'Поднял конверсию в покупку на 20% и сократил время поиска товара на 27%: переработал каталог, фильтры, меню и вкладки товара; решения подтверждены юзабилити-тестами и A/B-тестами', en: 'Raised purchase conversion by 20% and cut product search time by 27% by reworking the catalog, filters, menu and product tabs; confirmed with usability and A/B tests' },
      { ru: 'Сократил путь от поиска до заказа на два шага: быстрый заказ из карточки товара и упрощённое оформление', en: 'Cut the path from search to order by two steps: quick order from the product card and a simpler checkout' },
      { ru: 'Перестроил каталог вокруг автомобиля пользователя: запчасти подбираются проще', en: 'Rebuilt the catalog around the user’s car, so parts are easier to find' },
      { ru: 'Спроектировал новую главную страницу, структуру категорий согласовал с SEO', en: 'Designed a new home page and aligned the category structure with SEO' },
      { ru: 'Вместе с аналитиком и колл-центром нашёл точки потерь в воронке, провёл интервью с пользователями', en: 'Found funnel drop-off points with an analyst and the call center, and interviewed users' },
    ],
  },
  {
    period: { ru: 'июн 2024 – дек 2024', en: 'Jun 2024 – Dec 2024' },
    company: { ru: 'Правильная стоматология', en: 'Pravilnaya Stomatologiya' },
    icon: 'tooth', hue: 175, // иконка сферы и оттенок градиента плитки
    role: { ru: 'UX/UI Designer', en: 'UX/UI Designer' },
    domain: { ru: 'MedTech, сайт стоматологической клиники', en: 'MedTech, dental clinic website' },
    results: [
      { ru: 'Вместе с командой поднял конверсию в заявку с 1,2% до 3,8%: перестроил структуру сайта вокруг вопросов пациентов и сократил форму записи с восьми полей до двух', en: 'With the team raised lead conversion from 1.2% to 3.8%: rebuilt the site structure around patient questions and cut the booking form from eight fields to two' },
      { ru: 'Выявил барьеры на пути к записи: анализ данных Яндекс Метрики, глубинные интервью с пациентами, CJM', en: 'Found the barriers to booking with Yandex Metrika data analysis, in-depth patient interviews and a CJM' },
      { ru: 'Спроектировал калькулятор стоимости, страницы врачей и онлайн-запись с интеграцией в CRM клиники, чтобы вопросы о цене и выборе врача снимались до звонка', en: 'Designed a price calculator, doctor pages and online booking integrated with the clinic’s CRM, so questions about price and choosing a doctor are answered before a call' },
      { ru: 'Участвовал в разработке UI-кита сайта', en: 'Took part in building the site’s UI kit' },
    ],
  },
  {
    period: { ru: 'ноя 2023 – июн 2024', en: 'Nov 2023 – Jun 2024' },
    company: { ru: 'Фриланс', en: 'Freelance' },
    icon: 'globe', hue: 235, // иконка сферы и оттенок градиента плитки
    role: { ru: 'UI/UX Designer', en: 'UI/UX Designer' },
    domain: { ru: 'Сайты и мобильные приложения', en: 'Websites and mobile apps' },
    results: [
      { ru: 'Исследования аудитории и конкурентов, CJM, JTBD, user flow', en: 'Audience and competitor research, CJM, JTBD, user flows' },
      { ru: 'Адаптация интерфейсов под разные платформы', en: 'Adapting interfaces to different platforms' },
    ],
  },
];
