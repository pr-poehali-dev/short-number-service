const SITE_URL = "https://xn----8sba3afbebm8bqk.xn--p1ai/";

export const JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "КОРОТКИЙ-НОМЕР.РФ",
    alternateName: ["короткийномер.рф", "2407.рф", "быстрый-ответ.рф", "быстрыйответ.рф"],
    url: SITE_URL,
    description:
      "Полный справочник коротких и сервисных телефонных номеров России. Экстренные службы, поддержка операторов, банки, государственные сервисы. Все номера проверены вручную.",
    inLanguage: "ru",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://xn----8sba3afbebm8bqk.xn--p1ai/#directory?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Справочник коротких телефонных номеров России",
    description:
      "База данных коротких телефонных номеров России: экстренные службы (112, 101, 102, 103, 104), поддержка операторов МТС, Билайн, МегаФон, Т2, коммерческие номера банков и компаний.",
    url: SITE_URL,
    inLanguage: "ru",
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    dateModified: "2026-03-01",
    creator: { "@type": "Organization", name: "КОРОТКИЙ-НОМЕР.РФ", url: SITE_URL },
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "text/plain",
        contentUrl: "https://xn----8sba3afbebm8bqk.xn--p1ai/llms-full.txt",
      },
    ],
    keywords: ["короткие номера", "экстренные службы", "112", "МТС", "Билайн", "МегаФон", "Т2", "Сбербанк", "ВТБ", "телефоны России"],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Что такое короткие номера?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Короткие номера — это сокращённые телефонные номера для быстрого набора важных служб: экстренных, поддержки операторов, государственных сервисов. Их проще запомнить и быстрее набрать.",
        },
      },
      {
        "@type": "Question",
        name: "Можно ли звонить с любого телефона?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Универсальные номера (112, 101, 102, 103, 104) доступны со всех телефонов и операторов, даже без SIM-карты. Номера конкретных операторов работают только из своей сети, если не указано иное.",
        },
      },
      {
        "@type": "Question",
        name: "Платные ли звонки на короткие номера?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Экстренные и социальные номера всегда бесплатны. Номера поддержки операторов бесплатны при звонке с номера этого оператора. Уточняйте тарификацию в карточке номера.",
        },
      },
      {
        "@type": "Question",
        name: "Почему некоторые номера недоступны в роуминге?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Короткие номера операторов (поддержка, баланс) могут быть недоступны в международном роуминге. Экстренный номер 112 работает в большинстве стран мира.",
        },
      },
      {
        "@type": "Question",
        name: "Как получить свой короткий номер для бизнеса?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Нужно обратиться в Роскомнадзор или к оператору связи. Раздел «Процедуры» содержит подробные инструкции по каждому типу номеров.",
        },
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Справочник", item: SITE_URL + "#directory" },
      { "@type": "ListItem", position: 3, name: "По операторам", item: SITE_URL + "#operators" },
      { "@type": "ListItem", position: 4, name: "Универсальные номера", item: SITE_URL + "#universal" },
      { "@type": "ListItem", position: 5, name: "Часто задаваемые вопросы", item: SITE_URL + "#faq" },
    ],
  },
];

export const THEME_INIT_SCRIPT = `(function () {
  try {
    var saved = localStorage.getItem("theme");
    var dark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();`;

export const METRIKA_SCRIPT = `(function (m, e, t, r, i, k, a) {
    m[i] = m[i] || function () {
        (m[i].a = m[i].a || []).push(arguments)
    };
    m[i].l = 1 * new Date();
    for (var j = 0; j < document.scripts.length; j++) {
        if (document.scripts[j].src === r) {
            return;
        }
    }
    k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, k.onerror = function(){}, a.parentNode.insertBefore(k, a)
})
(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

ym(101026698, "init", {
    trustedDomains: ["poehali.dev"],
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
    trackHash: true
});

ym(103323875, "init", {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
    trackHash: true
});`;
