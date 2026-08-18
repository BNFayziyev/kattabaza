/**
 * Translations for the security checker.
 *
 * `checker.js` returns findings as `{ level, code, params }` — never prose.
 * This file turns those codes into text. Adding a language = adding one object.
 */

const TEXT = {
  en: {
    title: "Security check",
    subtitle: "Check an email, domain or link for scams and danger",
    tabEmail: "Email",
    tabDomain: "Domain",
    tabUrl: "Link",
    phEmail: "name@example.com",
    phDomain: "example.com",
    phUrl: "https://example.com/login",
    check: "Check",
    riskScore: "Risk score",

    verdict: {
      clean: "No danger signs found",
      minor: "Minor remarks",
      suspicious: "Suspicious",
      dangerous: "Dangerous — likely a scam",
      unknown: "Could not read the link",
    },

    emailValid: "Address looks real",
    emailFormatBad: "Invalid address format",
    emailNoMail: "This domain does not accept mail",
    emailNoDns: "Format is valid, DNS was not checked",
    emailFoundVia: (via) => `Mail server found (${via})`,
    emailFooter:
      "This shows whether the domain can receive mail. Whether this exact mailbox exists can only be confirmed by sending a message.",

    domainActive: "Domain is active",
    domainEmpty: "Domain is unregistered or has no DNS",
    domainInvalid: "Invalid domain format",

    deep: {
      anatomy: "Address breakdown",
      scheme: "Protocol",
      subdomain: "Subdomain",
      registrable: "Real domain",
      tld: "Zone",
      port: "Port",
      path: "Path",
      params: "Query parameters",
      fragment: "Fragment",
      hosting: "Hosting / server",
      whois: "Domain registration",
      created: "Registered",
      expires: "Expires",
      updated: "Last changed",
      age: "Age",
      registrar: "Registrar",
      status: "Status",
      days: (n) => `${n} days`,
      years: (n) => `${n} years`,
      redirects: "Embedded links",
      dnsRecords: "DNS records",
      cname: "Alias (CNAME)",
      caa: "Certificate policy (CAA)",
      dnssecOn: "DNSSEC enabled",
      dnssecOff: "No DNSSEC",
      noData: "no data",
      deepRunning: "Deep check running…",
    },

    urlFooter:
      "This analyses the address structure, DNS and domain registration date — it does not open the page. “No danger signs” does NOT mean the site is safe. Always be careful with unfamiliar links.",

    rec: {
      mx: "Mail servers (MX)",
      a: "IPv4 (A)",
      aaaa: "IPv6 (AAAA)",
      ns: "Name servers (NS)",
      ip: "IP addresses",
      more: (n) => `…${n} more`,
    },

    note: {
      // email
      empty: "Empty",
      tooLong: "Too long (over 254 characters)",
      noAt: "Missing @ or it is in the wrong place",
      badFormat: "Invalid format",
      localTooLong: "The part before @ exceeds 64 characters",
      doubleDots: "Two consecutive dots",
      disposable: "Disposable (temporary) mail service",
      roleAccount: "Role address, not personal (e.g. info@, admin@)",
      idnDomain: "Domain contains non-Latin characters",
      typo: (p) => `Possible typo — did you mean ${p.domain}?`,
      dnsFailed: "DNS lookup failed",
      noMailServer: "No mail server found",
      notRegistered: "Domain is not registered",
      // domain
      invalidDomain: "Invalid domain format",
      noSpf: "Mail is configured but there is no SPF record — easy to spoof",
      noDmarc: "No DMARC record",
      dnssec: "DNSSEC signature present",
      // url
      badUrl: "Could not read the link",
      impersonation: (p) =>
        `Pretends to be “${p.brand}” but the real domain is ${p.actual} — classic scam`,
      httpsOk: "Uses HTTPS",
      noHttps: "Not HTTPS — data is sent unencrypted",
      credsInUrl: "Login/password hidden in the address — classic phishing trick",
      ipHost: "IP address instead of a domain — untrustworthy sign",
      idnRisk: "Punycode / non-Latin letters — may imitate a well-known site",
      shortener: "Shortened link — the real address is hidden",
      riskyTld: (p) => `“.${p.tld}” zone is heavily used for spam and phishing`,
      manyLabels: (p) => `Too many parts (${p.count}) — the real domain may be hidden`,
      longHost: "Very long domain",
      manyHyphens: "Many hyphens in the domain — typical of imitation names",
      oddPort: (p) => `Unusual port: ${p.port}`,
      phishyWords: (p) => `Suspicious words: ${p.words.join(", ")}`,
      scamWords: (p) => `Scam vocabulary: ${p.words.join(", ")}`,
      executable: "Link to an executable file — verify before downloading",
      longPath: "Very long path",
      riskyCombo: "Dangerous combination: untrusted address + account/password words",
      scamCombo: "Dangerous combination: scam wording + throwaway domain zone",
      domainNotExist: "This domain does not exist at all",
      // deep analysis
      redirectParam: (p) => `Redirect parameter "${p.param}" points to ${p.target}`,
      redirectDangerous: (p) => `The embedded destination ${p.target} is itself dangerous`,
      encodedParam: (p) => `Encoded data in the address: ${p.params.join(", ")}`,
      brandNewDomain: (p) => `Domain is only ${p.days} days old — almost all scam sites are brand new`,
      veryNewDomain: (p) => `Domain is ${p.days} days old — quite new`,
      newDomain: (p) => `Domain is under a year old (${p.days} days)`,
      establishedDomain: (p) =>
        `Domain has existed for ${p.years} ${p.years === 1 ? "year" : "years"}`,
    },
  },

  ru: {
    title: "Проверка безопасности",
    subtitle: "Проверьте почту, домен или ссылку на мошенничество",
    tabEmail: "Почта",
    tabDomain: "Домен",
    tabUrl: "Ссылка",
    phEmail: "name@example.com",
    phDomain: "example.com",
    phUrl: "https://example.com/login",
    check: "Проверить",
    riskScore: "Уровень риска",

    verdict: {
      clean: "Признаков опасности не найдено",
      minor: "Незначительные замечания",
      suspicious: "Подозрительно",
      dangerous: "Опасно — вероятно мошенничество",
      unknown: "Не удалось прочитать ссылку",
    },

    emailValid: "Адрес выглядит настоящим",
    emailFormatBad: "Неверный формат адреса",
    emailNoMail: "Этот домен не принимает почту",
    emailNoDns: "Формат верный, DNS не проверялся",
    emailFoundVia: (via) => `Почтовый сервер найден (${via})`,
    emailFooter:
      "Проверка показывает, может ли домен принимать почту. Существует ли именно этот ящик, можно узнать только отправив письмо.",

    domainActive: "Домен активен",
    domainEmpty: "Домен не зарегистрирован или DNS не настроен",
    domainInvalid: "Неверный формат домена",

    deep: {
      anatomy: "Разбор адреса",
      scheme: "Протокол",
      subdomain: "Поддомен",
      registrable: "Настоящий домен",
      tld: "Зона",
      port: "Порт",
      path: "Путь",
      params: "Параметры запроса",
      fragment: "Фрагмент",
      hosting: "Хостинг / сервер",
      whois: "Регистрация домена",
      created: "Зарегистрирован",
      expires: "Истекает",
      updated: "Изменён",
      age: "Возраст",
      registrar: "Регистратор",
      status: "Статус",
      days: (n) => `${n} дн.`,
      years: (n) => `${n} г.`,
      redirects: "Вложенные ссылки",
      dnsRecords: "DNS-записи",
      cname: "Псевдоним (CNAME)",
      caa: "Политика сертификатов (CAA)",
      dnssecOn: "DNSSEC включён",
      dnssecOff: "DNSSEC отсутствует",
      noData: "нет данных",
      deepRunning: "Идёт глубокая проверка…",
    },

    urlFooter:
      "Анализируется структура адреса, DNS и дата регистрации домена — страница не открывается. «Признаков опасности не найдено» НЕ означает, что сайт безопасен. Будьте осторожны с незнакомыми ссылками.",

    rec: {
      mx: "Почтовые серверы (MX)",
      a: "IPv4 (A)",
      aaaa: "IPv6 (AAAA)",
      ns: "DNS-серверы (NS)",
      ip: "IP-адреса",
      more: (n) => `…ещё ${n}`,
    },

    note: {
      empty: "Пусто",
      tooLong: "Слишком длинный (более 254 символов)",
      noAt: "Нет символа @ или он не на месте",
      badFormat: "Неверный формат",
      localTooLong: "Часть до @ длиннее 64 символов",
      doubleDots: "Две точки подряд",
      disposable: "Одноразовый (временный) почтовый сервис",
      roleAccount: "Ролевой адрес, не личный (например info@, admin@)",
      idnDomain: "В домене нелатинские символы",
      typo: (p) => `Возможна опечатка — вы имели в виду ${p.domain}?`,
      dnsFailed: "DNS-запрос не выполнен",
      noMailServer: "Почтовый сервер не найден",
      notRegistered: "Домен не зарегистрирован",
      invalidDomain: "Неверный формат домена",
      noSpf: "Почта настроена, но нет записи SPF — легко подделать отправителя",
      noDmarc: "Нет записи DMARC",
      dnssec: "Есть подпись DNSSEC",
      badUrl: "Не удалось прочитать ссылку",
      impersonation: (p) =>
        `Выдаёт себя за «${p.brand}», но настоящий домен — ${p.actual}. Классическое мошенничество`,
      httpsOk: "Используется HTTPS",
      noHttps: "Не HTTPS — данные передаются открыто",
      credsInUrl: "В адресе спрятаны логин/пароль — классический приём фишинга",
      ipHost: "IP-адрес вместо домена — признак недоверия",
      idnRisk: "Punycode / нелатинские буквы — возможна подделка известного сайта",
      shortener: "Сокращённая ссылка — настоящий адрес скрыт",
      riskyTld: (p) => `Зона «.${p.tld}» часто используется для спама и фишинга`,
      manyLabels: (p) => `Слишком много частей (${p.count}) — настоящий домен может быть скрыт`,
      longHost: "Очень длинный домен",
      manyHyphens: "Много дефисов в домене — типично для подделок",
      oddPort: (p) => `Необычный порт: ${p.port}`,
      phishyWords: (p) => `Подозрительные слова: ${p.words.join(", ")}`,
      scamWords: (p) => `Мошеннические слова: ${p.words.join(", ")}`,
      executable: "Ссылка на исполняемый файл — проверьте перед загрузкой",
      longPath: "Очень длинный путь",
      riskyCombo: "Опасное сочетание: недоверенный адрес + слова о пароле/аккаунте",
      scamCombo: "Опасное сочетание: мошеннические слова + одноразовая доменная зона",
      domainNotExist: "Такого домена вообще не существует",
      // глубокий анализ
      redirectParam: (p) => `Параметр перенаправления «${p.param}» ведёт на ${p.target}`,
      redirectDangerous: (p) => `Вложенный адрес ${p.target} сам по себе опасен`,
      encodedParam: (p) => `Закодированные данные в адресе: ${p.params.join(", ")}`,
      brandNewDomain: (p) => `Домену всего ${p.days} дн. — почти все мошеннические сайты совсем новые`,
      veryNewDomain: (p) => `Домену ${p.days} дн. — довольно новый`,
      newDomain: (p) => `Домену меньше года (${p.days} дн.)`,
      establishedDomain: (p) => `Домен существует ${p.years} г.`,
    },
  },
};

export function getCheckerText(lang) {
  return TEXT[lang] || TEXT.en;
}

/** Render one finding `{level, code, params}` into text. */
export function renderNote(note, tc) {
  const entry = tc.note[note.code];
  if (!entry) return note.code;                 // unknown code — show it, don't crash
  return typeof entry === "function" ? entry(note.params || {}) : entry;
}
