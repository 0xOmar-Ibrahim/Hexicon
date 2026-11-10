// Vulnerability-type glossary and localized summary templates for imported CVE pages.
// The type is derived from CISA KEV's vulnerabilityName; summaries only state verified facts
// (type, product, vendor, KEV date, ransomware use). Contributors can replace them with richer
// hand-written translations at any time.

// Order matters: the first matching pattern wins.
export const TYPES = [
  ['rce', /remote code execution|code execution/i],
  ['cmdi', /command injection|os command/i],
  ['codei', /code injection|expression language injection|template injection/i],
  ['sqli', /sql injection/i],
  ['deser', /deserializ/i],
  ['upload', /unrestricted (file )?upload|file upload/i],
  ['path', /path traversal|directory traversal|relative path|external control of file name|files or directories accessible/i],
  ['ssrf', /server-side request forgery|\bssrf\b/i],
  ['xxe', /xml external entit|\bxxe\b/i],
  ['authbypass', /authentication bypass|missing authentication|improper authentication|authentication issue/i],
  ['privesc', /privilege escalation|elevation of privilege|escalation of privilege/i],
  ['authz', /authorization|access control|privilege management|permissions/i],
  ['uaf', /use[- ]after[- ]free/i],
  ['typeconf', /type confusion/i],
  ['memcorr', /buffer overflow|out-of-bounds write|heap[- ]based|stack[- ]based|integer overflow|memory corruption|double free|race condition|improper input validation|null pointer|uninitialized|missing initialization/i],
  ['infoleak', /information disclosure|out-of-bounds read|exposure|sensitive information|memory leak|cleartext/i],
  ['xss', /cross-site scripting|\bxss\b/i],
  ['csrf', /cross-site request forgery|\bcsrf\b/i],
  ['creds', /hard-?coded|default credential|weak credential/i],
  ['bypass', /security feature bypass|bypass/i],
  ['spoof', /spoofing/i],
  ['dos', /denial[- ]of[- ]service/i],
  ['injection', /injection/i],
  ['generic', /./],
];

export const classify = (name = '') => TYPES.find(([, re]) => re.test(name))[0];

export const TYPE_NAMES = {
  rce:        { en: 'Remote code execution', de: 'Remotecodeausführung', fr: 'Exécution de code à distance', ar: 'تنفيذ شيفرة عن بُعد', ru: 'Удалённое выполнение кода' },
  cmdi:       { en: 'Command injection', de: 'Befehlsinjektion', fr: 'Injection de commandes', ar: 'حقن الأوامر', ru: 'Внедрение команд' },
  codei:      { en: 'Code injection', de: 'Code-Injektion', fr: 'Injection de code', ar: 'حقن الشيفرة', ru: 'Внедрение кода' },
  sqli:       { en: 'SQL injection', de: 'SQL-Injection', fr: 'Injection SQL', ar: 'حقن SQL', ru: 'SQL-инъекция' },
  deser:      { en: 'Unsafe deserialization', de: 'Unsichere Deserialisierung', fr: 'Désérialisation non sécurisée', ar: 'إلغاء تسلسل غير آمن', ru: 'Небезопасная десериализация' },
  upload:     { en: 'Unrestricted file upload', de: 'Uneingeschränkter Datei-Upload', fr: 'Téléversement de fichiers non restreint', ar: 'رفع ملفات دون قيود', ru: 'Неограниченная загрузка файлов' },
  path:       { en: 'Path traversal', de: 'Pfadtraversierung', fr: 'Traversée de répertoires', ar: 'اجتياز المسارات', ru: 'Обход каталогов' },
  ssrf:       { en: 'Server-side request forgery', de: 'Server-Side Request Forgery', fr: 'Falsification de requête côté serveur', ar: 'تزوير الطلبات من جهة الخادم', ru: 'Подделка запросов на стороне сервера' },
  xxe:        { en: 'XML external entity injection', de: 'XML-External-Entity-Injection', fr: "Injection d'entité externe XML", ar: 'حقن كيانات XML الخارجية', ru: 'Внедрение внешних сущностей XML' },
  authbypass: { en: 'Authentication bypass', de: 'Umgehung der Authentifizierung', fr: "Contournement de l'authentification", ar: 'تجاوز المصادقة', ru: 'Обход аутентификации' },
  privesc:    { en: 'Privilege escalation', de: 'Rechteausweitung', fr: 'Élévation de privilèges', ar: 'رفع الصلاحيات', ru: 'Повышение привилегий' },
  authz:      { en: 'Improper access control', de: 'Fehlerhafte Zugriffskontrolle', fr: "Contrôle d'accès défaillant", ar: 'خلل في التحكم بالوصول', ru: 'Некорректный контроль доступа' },
  uaf:        { en: 'Use-after-free', de: 'Use-after-free', fr: 'Utilisation après libération', ar: 'استخدام بعد التحرير', ru: 'Использование после освобождения' },
  typeconf:   { en: 'Type confusion', de: 'Typverwechslung', fr: 'Confusion de type', ar: 'خلط الأنواع', ru: 'Путаница типов' },
  memcorr:    { en: 'Memory corruption', de: 'Speicherbeschädigung', fr: 'Corruption de mémoire', ar: 'إفساد الذاكرة', ru: 'Повреждение памяти' },
  infoleak:   { en: 'Information disclosure', de: 'Offenlegung von Informationen', fr: "Divulgation d'informations", ar: 'كشف المعلومات', ru: 'Раскрытие информации' },
  xss:        { en: 'Cross-site scripting', de: 'Cross-Site-Scripting', fr: 'Script intersite (XSS)', ar: 'البرمجة عبر المواقع (XSS)', ru: 'Межсайтовый скриптинг' },
  csrf:       { en: 'Cross-site request forgery', de: 'Cross-Site-Request-Forgery', fr: 'Falsification de requête intersite', ar: 'تزوير الطلبات عبر المواقع', ru: 'Межсайтовая подделка запросов' },
  creds:      { en: 'Hard-coded or default credentials', de: 'Fest codierte oder Standard-Zugangsdaten', fr: 'Identifiants codés en dur ou par défaut', ar: 'بيانات اعتماد مضمّنة أو افتراضية', ru: 'Жёстко заданные или стандартные учётные данные' },
  bypass:     { en: 'Security feature bypass', de: 'Umgehung einer Sicherheitsfunktion', fr: 'Contournement de fonction de sécurité', ar: 'تجاوز ميزة أمنية', ru: 'Обход механизма безопасности' },
  spoof:      { en: 'Spoofing', de: 'Spoofing', fr: 'Usurpation', ar: 'الانتحال', ru: 'Подмена' },
  dos:        { en: 'Denial of service', de: 'Dienstverweigerung', fr: 'Déni de service', ar: 'حجب الخدمة', ru: 'Отказ в обслуживании' },
  injection:  { en: 'Injection', de: 'Injektion', fr: 'Injection', ar: 'الحقن', ru: 'Внедрение' },
  generic:    { en: 'Security vulnerability', de: 'Sicherheitslücke', fr: 'Vulnérabilité de sécurité', ar: 'ثغرة أمنية', ru: 'Уязвимость безопасности' },
};

// Localized summary built only from verified facts.
const T = {
  de: (ty, prod, vendor, date, rw) => `${ty} in ${prod} (${vendor}). Die CISA hat die aktive Ausnutzung bestätigt und die Schwachstelle am ${date} in den KEV-Katalog aufgenommen.${rw ? ' Sie wird in Ransomware-Kampagnen ausgenutzt.' : ''} Die Hinweise des Herstellers umgehend umsetzen.`,
  fr: (ty, prod, vendor, date, rw) => `${ty} dans ${prod} (${vendor}). La CISA a confirmé son exploitation active et l'a ajoutée au catalogue KEV le ${date}.${rw ? ' Elle est exploitée dans des campagnes de rançongiciels.' : ''} Appliquez sans délai les correctifs ou mesures de l'éditeur.`,
  ar: (ty, prod, vendor, date, rw) => `${ty} في ${prod} (${vendor}). أكدت CISA استغلالها فعليًا وأضافتها إلى كتالوج KEV بتاريخ ${date}.${rw ? ' وتُستغل في حملات برامج الفدية.' : ''} طبّق تحديثات المورّد أو إجراءات التخفيف فورًا.`,
  ru: (ty, prod, vendor, date, rw) => `${ty} в ${prod} (${vendor}). CISA подтвердило активную эксплуатацию и добавило уязвимость в каталог KEV ${date}.${rw ? ' Используется в кампаниях вымогателей.' : ''} Как можно скорее примените исправления или меры защиты от производителя.`,
};

export function localizedSummaries({ name, vendor, product, dateAdded, ransomware }) {
  const type = classify(name);
  const out = {};
  for (const lang of Object.keys(T)) out[lang] = T[lang](TYPE_NAMES[type][lang], product, vendor, dateAdded, ransomware);
  return { type, summaries: out };
}
