// Qo'shimcha dasturlar katalogi (manba: yosh-avlod-kanali.vercel.app/programs va /os).
// Saytda manba nomi ko'rsatilmaydi — dasturlar bo'limlarga bo'lingan holda chiqadi.
// Bir dasturning turli versiyalari (til, bit, yil) bitta kartaga yig'ilgan —
// kartada versiya tanlanadi. /apps sahifasida bizning ilovalardan PASTDA turadi.
//
// Qo'shilmaganlar: buzilgan (crack) Photoshop, TLauncher, MAS aktivatsiya,
// yopilgan Skype va o'chib ketgan havolalar (Windows 7 EN, Windows 11 25H2 nusxasi).
// Hajmlar havolalarning o'zidan (2026-10-01) olingan; "~" — manba saytdagi taxminiy hajm.

// Ilovalar bo'limlari — chap menyuda va /apps/<id> da shu tartibda.
// "kattabaza" — bizning (jadvaldagi) ilovalar, doim birinchi.
export const APP_SECTIONS = [
  { id: "kattabaza", icon: "box" },
  { id: "os", icon: "monitor" },
  { id: "office", icon: "fileText" },
  { id: "ai", icon: "sparkles" },
  { id: "dev", icon: "code" },
  { id: "system", icon: "cpu" },
  { id: "internet", icon: "globe" },
  { id: "security", icon: "shield" },
  { id: "media", icon: "film" },
  { id: "android", icon: "phone" },
  { id: "games", icon: "gamepad" },
];

export const sectionOf = (item) => item.section || "kattabaza";

const TG = "https://t.me/Yosh_avlod_kanali";
const MS_OFFICE = "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us";
const WIN11_ARM = "https://software-static.download.prss.microsoft.com/dbazure/888969d5-f34g-4e03-ac9d-1f9786c66749/26200.6584.250915-1905.25h2_ge_release_svc_refresh_CLIENT_CONSUMER_A64FRE";
const PAPER = "https://fill-data.papermc.io/v1/objects";
const FORGE = "https://adfoc.us/serve/sitelinks/?id=271228&url=https://maven.minecraftforge.net/net/minecraftforge/forge";

// s — bo'lim, c — kategoriyalar (bizning jadvaldagi bilan bir xil nomlar: windows, vpn, zip...),
// d — tavsif [en, uz, ru], v — versiyalar [nomi, havola, hajmi?, turi?] yoki url — bitta havola.
const RAW = [
  // ─── Operatsion tizimlar ───────────────────────────────────────────────
  {
    id: "windows-11", title: "Windows 11 Pro", s: "os", c: ["windows", "os"],
    d: [
      "The latest Windows: new interface, best gaming performance and updated security.",
      "Eng so‘nggi Windows: yangi interfeys, o‘yinlarda yuqori unumdorlik va yangilangan xavfsizlik.",
      "Последняя Windows: новый интерфейс, лучшая производительность в играх и обновлённая защита.",
    ],
    v: [
      ["EN · x64", "https://zerofs.link/f/g8zr3R8/", "~5.4 GB", "ISO"],
      ["RU · x64", "https://zerofs.link/f/bvW3TDk/", "~5.4 GB", "ISO"],
      ["microsoft.com", "https://www.microsoft.com/software-download/windows11"],
    ],
  },
  {
    id: "windows-11-ltsc", title: "Windows 11 IoT Enterprise LTSC 2024", s: "os", c: ["windows", "os"],
    d: [
      "No bloatware or background junk, long-term official support and maximum stability.",
      "Ortiqcha dasturlarsiz, uzoq muddatli rasmiy yordam va yuqori barqarorlikka ega korporativ tizim.",
      "Без лишних программ и фоновых процессов, с долгой официальной поддержкой и высокой стабильностью.",
    ],
    v: [["EN · x64", "https://buzzheavier.com/2gtemvaqgfm3", "4.8 GB", "ISO"]],
  },
  {
    id: "windows-11-arm", title: "Windows 11 ARM64", s: "os", c: ["windows", "os"],
    d: [
      "Official Windows 11 ISO for ARM devices: Snapdragon PCs, Surface Pro X, Apple Silicon VMs.",
      "ARM qurilmalar uchun rasmiy Windows 11 ISO: Snapdragon, Surface Pro X, Apple Silicon VM.",
      "Официальный ISO Windows 11 для ARM: Snapdragon, Surface Pro X, ВМ на Apple Silicon.",
    ],
    v: [
      ["EN · 25H2", `${WIN11_ARM}_en-us.iso`, "6.8 GB"],
      ["RU · 25H2", `${WIN11_ARM}_ru-ru.iso`, "6.8 GB"],
    ],
  },
  {
    id: "windows-10", title: "Windows 10 Home / Pro 22H2", s: "os", c: ["windows", "os"],
    d: [
      "Proven and familiar, fully compatible with games and older software.",
      "Sinovdan o‘tgan va qulay, o‘yinlar hamda eski dasturlar bilan to‘liq mos tizim.",
      "Проверенная и привычная система, полностью совместима с играми и старыми программами.",
    ],
    v: [
      ["EN · x64", "https://buzzheavier.com/fuxscqu93mnn", "6.7 GB", "ISO"],
      ["EN · x86", "https://buzzheavier.com/4wlxz1qpf5vm", "4.6 GB", "ISO"],
      ["RU · x64", "https://buzzheavier.com/nltq3kxobqyy", "6.4 GB", "ISO"],
      ["RU · x86", "https://buzzheavier.com/kkonwh2ajbyb", "4.4 GB", "ISO"],
      ["microsoft.com", "https://www.microsoft.com/software-download/windows10"],
    ],
  },
  {
    id: "windows-10-iot", title: "Windows 10 IoT Enterprise 22H2", s: "os", c: ["windows", "os"],
    d: [
      "Lightweight enterprise Windows 10 without Microsoft bloatware — good for older PCs.",
      "Microsoft ortiqcha dasturlarisiz yengil korporativ Windows 10 — eski kompyuterlar uchun.",
      "Лёгкая корпоративная Windows 10 без лишних программ Microsoft — для старых ПК.",
    ],
    v: [["EN · x64", "https://buzzheavier.com/5eerq83cpgwi", "5.2 GB", "ISO"]],
  },
  {
    id: "windows-8-1", title: "Windows 8.1 with Update", s: "os", c: ["windows", "os"],
    d: [
      "Classic release between 7 and 10, great with legacy software. Apply a product key after install.",
      "7 va 10 o‘rtasidagi klassik versiya, eski dasturlar bilan yaxshi ishlaydi. O‘rnatgach mahsulot kalitini kiriting.",
      "Классика между 7 и 10, хорошо работает со старым ПО. После установки введите ключ продукта.",
    ],
    v: [
      ["EN · x64", "https://buzzheavier.com/2i65axai8pao", "4.0 GB", "ISO"],
      ["EN · x86", "https://buzzheavier.com/ddhrb4eax1x1", "3.0 GB", "ISO"],
      ["RU · x64", "https://zerofs.link/f/bOi9D_hBQaUfaZVn4FKLdsAa8co_6bVsmtFj1LckoO1MPyBNpKnSxqIS0opPzI6wynA/", "", "ISO"],
      ["RU · x86", "https://zerofs.link/f/M6BI4XXfRVeI6IPzEIkgDXPVApSq0FANyAK8bEozNAE5QN0CivxO1Hm5nbYO7Ls1OLY/", "", "ISO"],
    ],
  },
  {
    id: "windows-7", title: "Windows 7 SP1", s: "os", c: ["windows", "os"],
    d: [
      "The all-time classic — still the safest bet for very old PCs and retro software.",
      "Barcha zamonlar klassikasi — juda eski kompyuterlar va retro dasturlar uchun ishonchli tanlov.",
      "Классика всех времён — надёжный выбор для очень старых ПК и ретро-программ.",
    ],
    v: [
      ["RU · x64", "https://zerofs.link/f/XsmotsH_4CNUIl8k1-p2VN10LreJHgQhGCKoo7KY80Qbz2Ltn_9xegsiIC_IfjQsMro/", "~3.1 GB", "ISO"],
      ["RU · x86", "https://zerofs.link/f/DS3eFKYXF1ZsRZHyi3PmPp89qxAx-jajMOIICgvCcK9kO3X_JChfD1q1RLTUEZdR0Rg/", "", "ISO"],
    ],
  },
  {
    id: "ubuntu", title: "Ubuntu Desktop", s: "os", c: ["linux", "os"],
    d: [
      "The most popular Linux: huge community and app store, very easy to install and use.",
      "Eng mashhur Linux: katta hamjamiyat va dasturlar ombori, o‘rnatish va ishlatish juda oson.",
      "Самый популярный Linux: большое сообщество и магазин приложений, очень прост в установке.",
    ],
    url: "https://ubuntu.com/download/desktop",
  },
  {
    id: "kali", title: "Kali Linux", s: "os", c: ["linux", "os", "security"],
    d: [
      "The go-to Debian-based distro for penetration testing, with thousands of security tools.",
      "Penetratsion test va zaifliklarni aniqlash uchun eng mashhur distributiv, minglab xavfsizlik vositalari bilan.",
      "Самый известный дистрибутив для пентеста на базе Debian с тысячами инструментов безопасности.",
    ],
    url: "https://www.kali.org/get-kali/#kali-installer-images",
  },
  {
    id: "parrot", title: "Parrot Security OS", s: "os", c: ["linux", "os", "security"],
    d: [
      "Lightweight OS for security, privacy and development (MATE/KDE editions).",
      "Xavfsizlik, maxfiylik va dasturlash uchun yengil tizim (MATE/KDE).",
      "Лёгкая ОС для безопасности, приватности и разработки (MATE/KDE).",
    ],
    url: "https://parrotsec.org/download/",
  },
  {
    id: "blackarch", title: "BlackArch Linux", s: "os", c: ["linux", "os", "security"],
    d: [
      "Arch-based distro with 2800+ professional security and testing tools (~22 GB).",
      "Arch asosidagi, 2800 dan ortiq professional xavfsizlik vositalari bor katta tizim (~22 GB).",
      "Дистрибутив на базе Arch с 2800+ профессиональными инструментами безопасности (~22 ГБ).",
    ],
    url: "https://blackarch.org/downloads.html",
  },
  {
    id: "arch", title: "Arch Linux", s: "os", c: ["linux", "os"],
    d: [
      "Minimalist rolling-release distro — build your system yourself, piece by piece.",
      "Minimalist, doim yangilanadigan distributiv — tizimni o‘zingiz noldan yig‘asiz.",
      "Минималистичный rolling-release дистрибутив — собираете систему сами, по частям.",
    ],
    v: [
      ["ISO (latest)", "https://geo.mirror.pkgbuild.com/iso/latest/archlinux-x86_64.iso", "1.5 GB"],
      ["archlinux.org", "https://archlinux.org/download/"],
    ],
  },
  {
    id: "manjaro", title: "Manjaro Linux", s: "os", c: ["linux", "os"],
    d: [
      "Arch power with a simple graphical installer — ready to use out of the box.",
      "Arch qudrati va oddiy grafik o‘rnatuvchi — darhol ishlatishga tayyor.",
      "Мощь Arch и простой графический установщик — готов к работе сразу.",
    ],
    url: "https://manjaro.org/products/download/x86",
  },
  {
    id: "cachyos", title: "CachyOS", s: "os", c: ["linux", "os"],
    d: [
      "Performance-tuned Arch distro with optimized kernel and schedulers for x86-64-v3/v4.",
      "Tezlik uchun optimallashtirilgan yadro va scheduler’larga ega zamonaviy Arch distributivi.",
      "Arch-дистрибутив с оптимизированным ядром и планировщиками для максимальной скорости.",
    ],
    url: "https://cachyos.org/download/",
  },
  {
    id: "omarchy", title: "Omarchy Linux", s: "os", c: ["linux", "os"],
    d: [
      "Pre-configured, good-looking Arch spin that boots ready to work.",
      "Oldindan sozlangan, chiroyli Arch distributivi — noldan tayyor holda ishga tushadi.",
      "Предварительно настроенная красивая сборка Arch — готова к работе сразу.",
    ],
    v: [["3.8.2", "https://iso.omarchy.org/omarchy-3.8.2.iso", "7.3 GB"]],
  },

  // ─── Ofis va hujjatlar ─────────────────────────────────────────────────
  {
    id: "ms-office", title: "Microsoft Office Professional Plus", s: "office", c: ["windows", "office"],
    d: [
      "Official Microsoft CDN installer images (en-US): Word, Excel, PowerPoint, Outlook. License required.",
      "Microsoft rasmiy CDN’idan o‘rnatuvchi obrazlar (en-US): Word, Excel, PowerPoint, Outlook. Litsenziya kerak.",
      "Официальные образы с CDN Microsoft (en-US): Word, Excel, PowerPoint, Outlook. Нужна лицензия.",
    ],
    v: [
      ["365", `${MS_OFFICE}/O365ProPlusRetail.img`, "5.1 GB"],
      ["2024", `${MS_OFFICE}/ProPlus2024Retail.img`, "5.1 GB"],
      ["2021", `${MS_OFFICE}/ProPlus2021Retail.img`, "4.7 GB"],
      ["2019", `${MS_OFFICE}/ProPlus2019Retail.img`, "4.0 GB"],
      ["2016", `${MS_OFFICE}/ProPlusRetail.img`, "4.1 GB"],
    ],
  },
  {
    id: "libreoffice", title: "LibreOffice", s: "office", c: ["windows", "office"],
    d: ["Free and open-source office suite.", "Bepul va ochiq kodli ofis to‘plami.", "Бесплатный офисный пакет с открытым кодом."],
    url: "https://www.libreoffice.org/download/download-libreoffice/",
  },
  {
    id: "acrobat-reader", title: "Adobe Acrobat Reader", s: "office", c: ["windows", "pdf"],
    d: ["PDF viewer with annotation tools.", "Izoh qo‘shish imkoniyatli PDF o‘quvchi.", "Просмотрщик PDF с инструментами аннотаций."],
    url: "https://get.adobe.com/reader/",
  },
  {
    id: "foxit", title: "Foxit PDF Reader", s: "office", c: ["windows", "pdf"],
    d: ["Lightweight and fast PDF reader.", "Yengil va tez PDF o‘quvchi.", "Лёгкий и быстрый просмотрщик PDF."],
    url: "https://www.foxit.com/pdf-reader/",
  },
  {
    id: "notion", title: "Notion", s: "office", c: ["windows", "notes"],
    d: ["All-in-one workspace for notes, docs and projects.", "Eslatmalar, hujjatlar va loyihalar uchun yagona ish joyi.", "Единое пространство для заметок, документов и проектов."],
    url: "https://www.notion.so/desktop",
  },
  {
    id: "obsidian", title: "Obsidian", s: "office", c: ["windows", "notes"],
    d: ["Markdown knowledge base and note-taking app.", "Markdown asosidagi bilimlar bazasi va eslatmalar ilovasi.", "База знаний и заметки на Markdown."],
    url: "https://obsidian.md/download",
  },

  // ─── Sun'iy intellekt ──────────────────────────────────────────────────
  {
    id: "ollama", title: "Ollama", s: "ai", c: ["ai"],
    d: [
      "Run Llama, Mistral, Qwen and other open models locally on CPU/GPU from the terminal.",
      "Llama, Mistral, Qwen va boshqa ochiq modellarni kompyuteringizda (CPU/GPU) ishga tushirish.",
      "Запуск Llama, Mistral, Qwen и других открытых моделей локально на CPU/GPU.",
    ],
    url: "https://ollama.com/",
  },
  {
    id: "lm-studio", title: "LM Studio", s: "ai", c: ["ai"],
    d: [
      "Desktop app to download any Hugging Face model and chat with it through a clean GUI.",
      "Hugging Face modellarini yuklab, qulay grafik interfeysda chat qilish uchun desktop ilova.",
      "Десктоп-приложение: скачайте любую модель с Hugging Face и общайтесь с ней в удобном GUI.",
    ],
    url: "https://lmstudio.ai/",
  },
  {
    id: "anythingllm", title: "AnythingLLM", s: "ai", c: ["ai"],
    d: [
      "All-in-one local RAG assistant for your files and documents; works with any model.",
      "Fayl va hujjatlaringiz bilan ishlaydigan local RAG yordamchi; istalgan modelga ulanadi.",
      "Локальный RAG-ассистент для ваших файлов и документов; работает с любой моделью.",
    ],
    url: "https://anythingllm.com/",
  },
  {
    id: "open-webui", title: "Open WebUI", s: "ai", c: ["ai"],
    d: [
      "ChatGPT-like web interface for Ollama, LM Studio and any OpenAI-compatible API.",
      "Ollama, LM Studio va OpenAI formatidagi API’lar uchun ChatGPT’ga o‘xshash veb-interfeys.",
      "Веб-интерфейс в стиле ChatGPT для Ollama, LM Studio и любых OpenAI-совместимых API.",
    ],
    url: "https://github.com/open-webui/open-webui",
  },
  {
    id: "hugging-face", title: "Hugging Face", s: "ai", c: ["ai"],
    d: [
      "The largest open AI community: millions of models (GGUF, Safetensors) and datasets.",
      "Eng yirik ochiq AI hamjamiyati: millionlab modellar (GGUF, Safetensors) va datasetlar.",
      "Крупнейшее открытое AI-сообщество: миллионы моделей (GGUF, Safetensors) и датасетов.",
    ],
    url: "https://huggingface.co/",
  },
  {
    id: "free-claude-code", title: "Free Claude Code + Codex", s: "ai", c: ["ai", "dev"],
    d: [
      "Run the Claude Code and Codex CLIs on free API providers (NVIDIA NIM, OpenRouter, Gemini) or local models.",
      "Claude Code va Codex CLI’ni bepul API provayderlar (NVIDIA NIM, OpenRouter, Gemini) yoki local modellar bilan ishlatish.",
      "Claude Code и Codex CLI на бесплатных API (NVIDIA NIM, OpenRouter, Gemini) или локальных моделях.",
    ],
    url: "https://github.com/Alishahryar1/free-claude-code",
  },
  {
    id: "jarvis", title: "Jarvis MARK XXXVII", s: "ai", c: ["ai"],
    d: ["Open-source Jarvis-style AI assistant.", "Jarvis uslubidagi ochiq kodli AI yordamchi.", "AI-ассистент в стиле Джарвиса с открытым кодом."],
    url: "https://github.com/FatihMakes/Jarvis-MK37",
  },

  // ─── Dasturlash ────────────────────────────────────────────────────────
  {
    id: "git", title: "Git for Windows", s: "dev", c: ["windows", "dev"],
    d: ["Distributed version control system.", "Taqsimlangan versiyalar nazorati tizimi.", "Распределённая система контроля версий."],
    v: [
      ["2.55.0.2 · Telegram", `${TG}/4060`, "", "TG"],
      ["git-scm.com", "https://git-scm.com/downloads"],
    ],
  },
  {
    id: "nodejs", title: "Node.js", s: "dev", c: ["windows", "dev"],
    d: ["JavaScript runtime built on the V8 engine.", "V8 dvigatelidagi JavaScript muhiti.", "Среда выполнения JavaScript на движке V8."],
    v: [["LTS", "https://nodejs.org/en/download"]],
  },
  {
    id: "python", title: "Python", s: "dev", c: ["windows", "dev"],
    d: ["Popular language for development and scripting.", "Dasturlash va skriptlar uchun mashhur til.", "Популярный язык для разработки и скриптов."],
    url: "https://www.python.org/downloads/",
  },
  {
    id: "java", title: "Java (JDK / JRE)", s: "dev", c: ["windows", "dev", "minecraft"],
    d: [
      "Java for development and Minecraft servers. JDK 21 for new MC versions, JDK 17 for 1.18–1.20.4.",
      "Dasturlash va Minecraft serverlari uchun Java. Yangi MC uchun JDK 21, 1.18–1.20.4 uchun JDK 17.",
      "Java для разработки и серверов Minecraft. JDK 21 для новых версий MC, JDK 17 для 1.18–1.20.4.",
    ],
    v: [
      ["JDK 21", "https://download.oracle.com/java/21/archive/jdk-21.0.9_windows-x64_bin.exe", "164 MB"],
      ["JDK 17", "https://download.oracle.com/java/17/archive/jdk-17.0.12_windows-x64_bin.exe", "154 MB"],
      ["JRE 8", "https://www.java.com/en/download/"],
    ],
  },
  {
    id: "miniconda", title: "Miniconda", s: "dev", c: ["windows", "linux", "dev"],
    d: [
      "Minimal conda installer for Python environments. On Linux: bash Miniconda3-*.sh",
      "Python muhitlari uchun ixcham conda o‘rnatuvchisi. Linux’da: bash Miniconda3-*.sh",
      "Минимальный установщик conda для окружений Python. В Linux: bash Miniconda3-*.sh",
    ],
    v: [
      ["Windows", "https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe", "126 MB"],
      ["Linux", "https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh", "189 MB"],
    ],
  },
  {
    id: "anaconda", title: "Anaconda Distribution", s: "dev", c: ["windows", "linux", "dev"],
    d: [
      "Full Python data-science distribution. On Linux: bash Anaconda3-*.sh",
      "Ma’lumotlar tahlili uchun to‘liq Python distributivi. Linux’da: bash Anaconda3-*.sh",
      "Полный дистрибутив Python для data science. В Linux: bash Anaconda3-*.sh",
    ],
    v: [
      ["Windows · 2025.12-2", "https://repo.anaconda.com/archive/Anaconda3-2025.12-2-Windows-x86_64.exe", "1.1 GB"],
      ["Linux · 2025.12-2", "https://repo.anaconda.com/archive/Anaconda3-2025.12-2-Linux-x86_64.sh", "1.2 GB"],
    ],
  },
  {
    id: "vscode", title: "Visual Studio Code", s: "dev", c: ["windows", "dev"],
    d: ["Lightweight but powerful code editor.", "Yengil, lekin kuchli kod muharriri.", "Лёгкий, но мощный редактор кода."],
    url: "https://code.visualstudio.com/download",
  },
  {
    id: "notepad-plus-plus", title: "Notepad++", s: "dev", c: ["windows", "dev"],
    d: ["Free source code editor and Notepad replacement.", "Bepul kod muharriri, Notepad o‘rnini bosadi.", "Бесплатный редактор кода, замена Блокноту."],
    url: "https://notepad-plus-plus.org/downloads/",
  },
  {
    id: "sublime-text", title: "Sublime Text", s: "dev", c: ["windows", "dev"],
    d: ["Fast text editor for code and markup.", "Kod va belgilash uchun tezkor matn muharriri.", "Быстрый текстовый редактор для кода и разметки."],
    url: "https://www.sublimetext.com/download",
  },
  {
    id: "intellij", title: "JetBrains IntelliJ IDEA", s: "dev", c: ["windows", "dev"],
    d: ["Powerful IDE for Java and Kotlin.", "Java va Kotlin uchun kuchli IDE.", "Мощная IDE для Java и Kotlin."],
    url: "https://www.jetbrains.com/idea/download/",
  },
  {
    id: "docker", title: "Docker Desktop", s: "dev", c: ["windows", "dev"],
    d: ["Build and run containers on your desktop.", "Konteynerlarni yaratish va ishga tushirish platformasi.", "Сборка и запуск контейнеров на компьютере."],
    url: "https://www.docker.com/products/docker-desktop/",
  },
  {
    id: "postman", title: "Postman", s: "dev", c: ["windows", "dev"],
    d: ["Build and test APIs.", "API yaratish va sinash platformasi.", "Платформа для создания и тестирования API."],
    url: "https://www.postman.com/downloads/",
  },
  {
    id: "putty", title: "PuTTY", s: "dev", c: ["windows", "dev"],
    d: ["Free SSH and telnet client.", "Bepul SSH va telnet mijozi.", "Бесплатный SSH- и telnet-клиент."],
    url: "https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html",
  },
  {
    id: "winscp", title: "WinSCP", s: "dev", c: ["windows", "dev"],
    d: ["Free SFTP / FTP client for Windows.", "Windows uchun bepul SFTP / FTP mijozi.", "Бесплатный SFTP/FTP-клиент для Windows."],
    url: "https://winscp.net/eng/download.php",
  },
  {
    id: "filezilla", title: "FileZilla", s: "dev", c: ["windows", "dev"],
    d: ["Free FTP client for file transfers.", "Fayl almashish uchun bepul FTP mijozi.", "Бесплатный FTP-клиент для передачи файлов."],
    url: "https://filezilla-project.org/download.php",
  },

  // ─── Tizim vositalari ──────────────────────────────────────────────────
  {
    id: "7zip", title: "7-Zip", s: "system", c: ["windows", "zip"],
    d: ["Free open-source archiver with high compression.", "Yuqori siqish darajali bepul arxivator.", "Бесплатный архиватор с высокой степенью сжатия."],
    url: "https://www.7-zip.org/download.html",
  },
  {
    id: "winrar", title: "WinRAR", s: "system", c: ["windows", "zip"],
    d: ["Archive manager for RAR and ZIP files.", "RAR va ZIP arxivlari bilan ishlash dasturi.", "Архиватор для файлов RAR и ZIP."],
    url: "https://www.win-rar.com/download.html",
  },
  {
    id: "everything", title: "Everything", s: "system", c: ["windows", "system"],
    d: ["Instant file search for Windows.", "Windows uchun bir zumda fayl qidiruvi.", "Мгновенный поиск файлов в Windows."],
    url: "https://www.voidtools.com/downloads/",
  },
  {
    id: "total-commander", title: "Total Commander", s: "system", c: ["windows", "system"],
    d: ["Dual-pane file manager.", "Ikki panelli fayl menejeri.", "Двухпанельный файловый менеджер."],
    url: "https://www.ghisler.com/download.htm",
  },
  {
    id: "ventoy", title: "Ventoy", s: "system", c: ["windows", "linux", "system"],
    d: [
      "Multiboot USB: copy ISO/VHD files to the stick and boot any of them.",
      "Multiboot fleshka: ISO/VHD fayllarni nusxalab, istalganidan yuklash.",
      "Мультизагрузочная флешка: скопируйте ISO/VHD и загружайтесь с любого.",
    ],
    url: "https://www.ventoy.net/en/download.html",
  },
  {
    id: "partition-wizard", title: "Mini Partition Wizard", s: "system", c: ["windows", "system"],
    d: ["Disk partition manager.", "Disk bo‘limlarini boshqarish dasturi.", "Менеджер разделов диска."],
    v: [["2025 · Telegram", `${TG}/3324`, "", "TG"]],
  },
  {
    id: "ntlite", title: "NTLite", s: "system", c: ["windows", "system"],
    d: ["Build your own customized Windows image.", "O‘zingizga moslangan Windows obrazini yasash.", "Создание собственного настроенного образа Windows."],
    v: [["2025 · Telegram", `${TG}/3451`, "", "TG"]],
  },
  {
    id: "winaero-tweaker", title: "Winaero Tweaker", s: "system", c: ["windows", "system"],
    d: ["Windows customization tool.", "Windows’ni sozlash vositasi.", "Утилита для тонкой настройки Windows."],
    v: [["Telegram", `${TG}/3544`, "", "TG"]],
  },
  {
    id: "ccleaner", title: "CCleaner", s: "system", c: ["windows", "system"],
    d: ["System cleaning and optimization.", "Tizimni tozalash va optimallashtirish.", "Очистка и оптимизация системы."],
    url: "https://www.ccleaner.com/ccleaner/download",
  },
  {
    id: "revo", title: "Revo Uninstaller", s: "system", c: ["windows", "system"],
    d: ["Removes programs together with leftovers.", "Dasturlarni qoldiqlari bilan birga o‘chiradi.", "Удаляет программы вместе с остатками."],
    url: "https://www.revouninstaller.com/revo-uninstaller-free-download/",
  },
  {
    id: "cpu-z", title: "CPU-Z", s: "system", c: ["windows", "system"],
    d: ["CPU, memory and motherboard info.", "Protsessor, xotira va ona plata haqida ma’lumot.", "Информация о процессоре, памяти и плате."],
    url: "https://www.cpuid.com/softwares/cpu-z.html",
  },
  {
    id: "hwmonitor", title: "HWMonitor", s: "system", c: ["windows", "system"],
    d: ["Temperature, voltage and fan monitoring.", "Harorat, kuchlanish va sovutgichlarni kuzatish.", "Мониторинг температур, напряжений и вентиляторов."],
    url: "https://www.cpuid.com/softwares/hwmonitor.html",
  },
  {
    id: "speccy", title: "Speccy", s: "system", c: ["windows", "system"],
    d: ["Detailed PC specs at a glance.", "Kompyuter xususiyatlari haqida batafsil ma’lumot.", "Подробные характеристики ПК."],
    url: "https://www.ccleaner.com/speccy/download",
  },
  {
    id: "crystaldiskinfo", title: "CrystalDiskInfo", s: "system", c: ["windows", "system"],
    d: ["HDD/SSD health monitoring.", "HDD/SSD disklar holatini tekshirish.", "Контроль состояния HDD/SSD."],
    url: "https://crystalmark.info/en/software/crystaldiskinfo/",
  },
  {
    id: "virtualbox", title: "VirtualBox", s: "system", c: ["windows", "linux", "system"],
    d: ["Free open-source virtual machines.", "Bepul ochiq kodli virtual mashinalar.", "Бесплатные виртуальные машины с открытым кодом."],
    url: "https://www.virtualbox.org/wiki/Downloads",
  },
  {
    id: "vmware", title: "VMware Workstation", s: "system", c: ["windows", "system"],
    d: ["Run virtual machines on your PC.", "Kompyuterda virtual mashinalarni ishga tushirish.", "Запуск виртуальных машин на ПК."],
    url: "https://www.vmware.com/products/desktop-hypervisor/workstation-and-fusion",
  },
  {
    id: "dotnet-framework", title: ".NET Framework", s: "system", c: ["windows", "system"],
    d: ["Microsoft runtime for Windows apps.", "Windows ilovalari uchun Microsoft muhiti.", "Среда выполнения Microsoft для приложений Windows."],
    url: "https://dotnet.microsoft.com/download/dotnet-framework",
  },
  {
    id: "vc-redist", title: "Visual C++ Redistributable", s: "system", c: ["windows", "system"],
    d: ["Runtime components for C++ apps and games.", "C++ ilova va o‘yinlar uchun kerakli komponentlar.", "Компоненты для запуска C++ программ и игр."],
    url: "https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist",
  },
  {
    id: "directx", title: "DirectX", s: "system", c: ["windows", "system", "games"],
    d: ["Gaming and multimedia APIs for Windows.", "Windows’da o‘yin va multimedia uchun API’lar.", "API для игр и мультимедиа в Windows."],
    url: "https://www.microsoft.com/download/details.aspx?id=35",
  },

  // ─── Internet va aloqa ─────────────────────────────────────────────────
  {
    id: "chrome", title: "Google Chrome", s: "internet", c: ["windows", "browser", "chrome"],
    d: ["Fast and secure browser by Google.", "Google’ning tez va xavfsiz brauzeri.", "Быстрый и безопасный браузер от Google."],
    url: "https://www.google.com/chrome/",
  },
  {
    id: "firefox", title: "Mozilla Firefox", s: "internet", c: ["windows", "browser"],
    d: ["Privacy-focused open-source browser.", "Maxfiylikka e’tiborli ochiq kodli brauzer.", "Браузер с открытым кодом и упором на приватность."],
    url: "https://www.mozilla.org/firefox/download/",
  },
  {
    id: "edge", title: "Microsoft Edge", s: "internet", c: ["windows", "browser"],
    d: ["Chromium-based browser by Microsoft.", "Microsoft’ning Chromium asosidagi brauzeri.", "Браузер Microsoft на базе Chromium."],
    url: "https://www.microsoft.com/edge",
  },
  {
    id: "brave", title: "Brave Browser", s: "internet", c: ["windows", "browser"],
    d: ["Private browser with a built-in ad blocker.", "Reklama bloklovchisi o‘rnatilgan maxfiy brauzer.", "Приватный браузер со встроенным блокировщиком рекламы."],
    url: "https://brave.com/download/",
  },
  {
    id: "opera", title: "Opera", s: "internet", c: ["windows", "browser"],
    d: ["Browser with built-in VPN and messengers.", "VPN va messenjerlar o‘rnatilgan brauzer.", "Браузер со встроенным VPN и мессенджерами."],
    url: "https://www.opera.com/download",
  },
  {
    id: "telegram-desktop", title: "Telegram Desktop", s: "internet", c: ["windows", "telegram"],
    d: ["Fast and secure messenger for the desktop.", "Kompyuter uchun tez va xavfsiz messenjer.", "Быстрый и безопасный мессенджер для ПК."],
    url: "https://desktop.telegram.org/",
  },
  {
    id: "whatsapp", title: "WhatsApp Desktop", s: "internet", c: ["windows"],
    d: ["WhatsApp on your computer.", "Kompyuter uchun WhatsApp.", "WhatsApp на компьютере."],
    url: "https://www.whatsapp.com/download",
  },
  {
    id: "discord", title: "Discord", s: "internet", c: ["windows"],
    d: ["Voice, video and text chat.", "Ovozli, video va matnli muloqot.", "Голосовой, видео- и текстовый чат."],
    url: "https://discord.com/download",
  },
  {
    id: "slack", title: "Slack", s: "internet", c: ["windows"],
    d: ["Team communication platform.", "Jamoaviy muloqot platformasi.", "Платформа для общения в команде."],
    url: "https://slack.com/downloads/windows",
  },
  {
    id: "teams", title: "Microsoft Teams", s: "internet", c: ["windows"],
    d: ["Team chat and video meetings.", "Jamoa chati va video uchrashuvlar.", "Командный чат и видеовстречи."],
    url: "https://www.microsoft.com/microsoft-teams/download-app",
  },
  {
    id: "zoom", title: "Zoom", s: "internet", c: ["windows"],
    d: ["Video conferencing and online meetings.", "Video konferensiyalar va onlayn uchrashuvlar.", "Видеоконференции и онлайн-встречи."],
    url: "https://zoom.us/download",
  },
  {
    id: "teamviewer", title: "TeamViewer", s: "internet", c: ["windows", "lookout"],
    d: ["Remote desktop access and support.", "Masofaviy ish stoliga ulanish va yordam.", "Удалённый доступ к рабочему столу."],
    url: "https://www.teamviewer.com/en/download/windows/",
  },
  {
    id: "anydesk", title: "AnyDesk", s: "internet", c: ["windows", "lookout", "anydesk"],
    d: ["Fast remote desktop app.", "Tezkor masofaviy ulanish dasturi.", "Быстрый удалённый рабочий стол."],
    url: "https://anydesk.com/en/downloads/windows",
  },
  {
    id: "qbittorrent", title: "qBittorrent", s: "internet", c: ["windows"],
    d: ["Free open-source BitTorrent client.", "Bepul ochiq kodli BitTorrent mijozi.", "Бесплатный BitTorrent-клиент с открытым кодом."],
    url: "https://www.qbittorrent.org/download",
  },
  {
    id: "idm", title: "Internet Download Manager", s: "internet", c: ["windows"],
    d: ["Download accelerator and manager.", "Yuklab olishni tezlashtiruvchi menejer.", "Менеджер и ускоритель загрузок."],
    url: "https://www.internetdownloadmanager.com/download.html",
  },
  {
    id: "fdm", title: "Free Download Manager", s: "internet", c: ["windows"],
    d: ["Free modern download manager.", "Bepul zamonaviy yuklab olish menejeri.", "Бесплатный современный менеджер загрузок."],
    url: "https://www.freedownloadmanager.org/download.htm",
  },
  {
    id: "dropbox", title: "Dropbox", s: "internet", c: ["windows", "cloud"],
    d: ["Cloud storage and file sync.", "Bulutli xotira va fayllarni sinxronlash.", "Облачное хранилище и синхронизация файлов."],
    url: "https://www.dropbox.com/install",
  },
  {
    id: "google-drive", title: "Google Drive", s: "internet", c: ["windows", "cloud"],
    d: ["Cloud storage and backup from Google.", "Google’ning bulutli xotirasi va zaxira nusxasi.", "Облачное хранилище и резервные копии от Google."],
    url: "https://www.google.com/drive/download/",
  },
  {
    id: "onedrive", title: "OneDrive", s: "internet", c: ["windows", "cloud"],
    d: ["Microsoft cloud storage built into Windows.", "Windows’ga o‘rnatilgan Microsoft bulutli xotirasi.", "Облачное хранилище Microsoft, встроенное в Windows."],
    url: "https://www.microsoft.com/microsoft-365/onedrive/download",
  },

  // ─── Xavfsizlik va VPN ─────────────────────────────────────────────────
  {
    id: "openvpn", title: "OpenVPN Connect", s: "security", c: ["windows", "vpn"],
    d: [
      "Free VPN client for Windows (the config file is in the Telegram channel).",
      "Windows uchun bepul VPN mijozi (config fayl Telegram kanalda).",
      "Бесплатный VPN-клиент для Windows (конфиг — в Telegram-канале).",
    ],
    v: [["v3", "https://openvpn.net/downloads/openvpn-connect-v3-windows.msi", "120 MB"]],
  },
  {
    id: "nordvpn", title: "NordVPN", s: "security", c: ["windows", "vpn"],
    d: ["VPN service for online privacy.", "Internetda maxfiylik uchun VPN xizmati.", "VPN-сервис для приватности в сети."],
    url: "https://nordvpn.com/download/",
  },
  {
    id: "malwarebytes", title: "Malwarebytes", s: "security", c: ["windows", "security"],
    d: ["Anti-malware protection.", "Zararli dasturlarga qarshi himoya.", "Защита от вредоносных программ."],
    url: "https://www.malwarebytes.com/mwb-download",
  },
  {
    id: "avast", title: "Avast Free Antivirus", s: "security", c: ["windows", "security"],
    d: ["Free antivirus protection.", "Bepul antivirus himoyasi.", "Бесплатная антивирусная защита."],
    url: "https://www.avast.com/free-antivirus-download",
  },
  {
    id: "bitwarden", title: "Bitwarden", s: "security", c: ["windows", "security"],
    d: ["Open-source password manager.", "Ochiq kodli parol menejeri.", "Менеджер паролей с открытым кодом."],
    url: "https://bitwarden.com/download/",
  },
  {
    id: "keepass", title: "KeePass", s: "security", c: ["windows", "security"],
    d: ["Free offline password manager.", "Bepul oflayn parol menejeri.", "Бесплатный офлайн-менеджер паролей."],
    url: "https://keepass.info/download.html",
  },

  // ─── Grafika va media ──────────────────────────────────────────────────
  {
    id: "gimp", title: "GIMP", s: "media", c: ["windows", "media"],
    d: ["Free open-source image editor.", "Bepul ochiq kodli rasm muharriri.", "Бесплатный графический редактор с открытым кодом."],
    url: "https://www.gimp.org/downloads/",
  },
  {
    id: "paint-net", title: "Paint.NET", s: "media", c: ["windows", "media"],
    d: ["Free image and photo editor.", "Bepul rasm va foto muharriri.", "Бесплатный редактор изображений и фото."],
    url: "https://www.getpaint.net/download.html",
  },
  {
    id: "inkscape", title: "Inkscape", s: "media", c: ["windows", "media"],
    d: ["Free vector graphics editor.", "Bepul vektor grafika muharriri.", "Бесплатный редактор векторной графики."],
    url: "https://inkscape.org/release/",
  },
  {
    id: "figma", title: "Figma", s: "media", c: ["windows", "media"],
    d: ["Collaborative interface design tool.", "Interfeyslarni birgalikda loyihalash vositasi.", "Инструмент для совместного дизайна интерфейсов."],
    url: "https://www.figma.com/downloads/",
  },
  {
    id: "blender", title: "Blender", s: "media", c: ["windows", "media"],
    d: ["Free 3D modeling and animation suite.", "Bepul 3D modellash va animatsiya to‘plami.", "Бесплатный пакет 3D-моделирования и анимации."],
    url: "https://www.blender.org/download/",
  },
  {
    id: "obs", title: "OBS Studio", s: "media", c: ["windows", "media"],
    d: ["Screen recording and live streaming.", "Ekranni yozib olish va jonli efir.", "Запись экрана и прямые трансляции."],
    url: "https://obsproject.com/download",
  },
  {
    id: "davinci-resolve", title: "DaVinci Resolve", s: "media", c: ["windows", "media"],
    d: ["Professional video editing and color grading.", "Professional video montaj va rang tuzatish.", "Профессиональный монтаж и цветокоррекция."],
    url: "https://www.blackmagicdesign.com/products/davinciresolve",
  },
  {
    id: "handbrake", title: "HandBrake", s: "media", c: ["windows", "media"],
    d: ["Open-source video converter.", "Ochiq kodli video konvertor.", "Видеоконвертер с открытым кодом."],
    url: "https://handbrake.fr/downloads.php",
  },
  {
    id: "audacity", title: "Audacity", s: "media", c: ["windows", "media"],
    d: ["Free audio editor and recorder.", "Bepul audio muharrir va yozib olish dasturi.", "Бесплатный аудиоредактор и рекордер."],
    url: "https://www.audacityteam.org/download/",
  },
  {
    id: "sharex", title: "ShareX", s: "media", c: ["windows", "media"],
    d: ["Screenshots, screen recording and file sharing.", "Skrinshot, ekran yozuvi va fayl ulashish.", "Скриншоты, запись экрана и обмен файлами."],
    url: "https://getsharex.com/",
  },
  {
    id: "vlc", title: "VLC Media Player", s: "media", c: ["windows", "media"],
    d: ["Plays almost any audio and video format.", "Deyarli barcha audio va video formatlarni o‘ynatadi.", "Воспроизводит почти любые аудио и видео."],
    url: "https://www.videolan.org/vlc/",
  },
  {
    id: "potplayer", title: "PotPlayer", s: "media", c: ["windows", "media"],
    d: ["Feature-rich media player.", "Imkoniyatlari keng media pleyer.", "Мультимедиаплеер с богатыми возможностями."],
    url: "https://potplayer.tv/",
  },
  {
    id: "spotify", title: "Spotify", s: "media", c: ["windows", "media"],
    d: ["Music streaming.", "Musiqa striming xizmati.", "Стриминг музыки."],
    url: "https://www.spotify.com/download/windows/",
  },
  {
    id: "foobar2000", title: "foobar2000", s: "media", c: ["windows", "media"],
    d: ["Advanced audio player.", "Ilg‘or audio pleyer.", "Продвинутый аудиоплеер."],
    url: "https://www.foobar2000.org/download",
  },
  {
    id: "itunes", title: "iTunes", s: "media", c: ["windows", "media"],
    d: ["Media library for Apple devices.", "Apple qurilmalari uchun media kutubxona.", "Медиатека для устройств Apple."],
    url: "https://www.apple.com/itunes/download/",
  },

  // ─── Android ───────────────────────────────────────────────────────────
  {
    id: "termux", title: "Termux", s: "android", c: ["android", "linux"],
    d: ["Linux terminal emulator for Android.", "Android uchun Linux terminal emulyatori.", "Эмулятор Linux-терминала для Android."],
    v: [["0.118.3", "https://github.com/termux/termux-app/releases/download/v0.118.3/termux-app_v0.118.3+github-debug_universal.apk", "112 MB"]],
  },
  {
    id: "termux-x11", title: "Termux:X11", s: "android", c: ["android", "linux"],
    d: [
      "X11 server for Termux — run Linux desktop apps on the phone.",
      "Termux uchun X11 server — telefonda Linux grafik ilovalarini ishga tushirish.",
      "X11-сервер для Termux — графические Linux-приложения на телефоне.",
    ],
    v: [["nightly", "https://github.com/termux/termux-x11/releases/download/nightly/termux-x11-universal-debug.apk", "14 MB"]],
  },
  {
    id: "termux-linux-script", title: "Termux Linux install script", s: "android", c: ["android", "linux"],
    d: [
      "Script that installs Linux distributions on the phone through Termux.",
      "Termux orqali telefonga Linux distributivlarini o‘rnatish skripti.",
      "Скрипт установки Linux-дистрибутивов на телефон через Termux.",
    ],
    v: [["TXT · Telegram", `${TG}/3709`, "", "TG"]],
  },
  {
    id: "winlator", title: "Winlator CMOD", s: "android", c: ["android", "windows", "games"],
    d: ["Run Windows apps and games on Android.", "Windows dastur va o‘yinlarini Android’da ishga tushirish.", "Запуск Windows-программ и игр на Android."],
    v: [["13.1.1", "https://github.com/coffincolors/winlator/releases/download/cmod_v13.1/Winlator-Cmod-v13.1.1.apk", "667 MB"]],
  },

  // ─── O'yinlar va Minecraft ─────────────────────────────────────────────
  {
    id: "mc-vanilla", title: "Minecraft Server (Vanilla)", s: "games", c: ["minecraft", "games"],
    d: [
      "Official Mojang server. Run: java -jar server.jar (newer versions need a newer Java).",
      "Mojang‘ning rasmiy serveri. Ishga tushirish: java -jar server.jar (yangi versiyalarga yangi Java kerak).",
      "Официальный сервер Mojang. Запуск: java -jar server.jar (новым версиям нужна новая Java).",
    ],
    v: [
      ["26.3", "https://piston-data.mojang.com/v1/objects/33680f5f2ac32864d6d7cf5e56a705fdb3e05f4c/server.jar", "59 MB"],
      ["1.21.11", "https://piston-data.mojang.com/v1/objects/64bb6d763bed0a9f1d632ec347938594144943ed/server.jar", "54 MB"],
      ["1.20.1", "https://piston-data.mojang.com/v1/objects/84194a2f286ef7c14ed7ce0090dba59902951553/server.jar", "46 MB"],
      ["1.16.5", "https://launcher.mojang.com/v1/objects/1b557e7b033b583cd9f66746b7a9ab1ec1673ced/server.jar", "36 MB"],
    ],
  },
  {
    id: "mc-paper", title: "Minecraft Server (PaperMC)", s: "games", c: ["minecraft", "games"],
    d: [
      "Fast, plugin-friendly server based on Spigot.",
      "Spigot asosidagi tez va plaginlarni qo‘llovchi server.",
      "Быстрый сервер на базе Spigot с поддержкой плагинов.",
    ],
    v: [
      ["1.21.1", `${PAPER}/39bd8c00b9e18de91dcabd3cc3dcfa5328685a53b7187a2f63280c22e2d287b9/paper-1.21.1-133.jar`, "47 MB"],
      ["1.20.1", `${PAPER}/234a9b32098100c6fc116664d64e36ccdb58b5b649af0f80bcccb08b0255eaea/paper-1.20.1-196.jar`, "41 MB"],
      ["1.16.5", `${PAPER}/e67da4851d08cde378ab2b89be58849238c303351ed2482181a99c2c2b489276/paper-1.16.5-794.jar`, "51 MB"],
    ],
  },
  {
    id: "mc-forge", title: "Minecraft Server (Forge)", s: "games", c: ["minecraft", "games"],
    d: [
      "Mod loader installer — choose \"Install server\" when it opens.",
      "Mod yuklovchi o‘rnatuvchisi — ochilganda \"Install server\" ni tanlang.",
      "Установщик загрузчика модов — при запуске выберите \"Install server\".",
    ],
    v: [
      ["1.21.11", `${FORGE}/1.21.11-61.0.8/forge-1.21.11-61.0.8-installer.jar`, "8.9 MB", "JAR"],
      ["1.20.1", `${FORGE}/1.20.1-47.4.10/forge-1.20.1-47.4.10-installer.jar`, "5.8 MB", "JAR"],
    ],
  },
  {
    id: "mc-fabric", title: "Minecraft Server (Fabric)", s: "games", c: ["minecraft", "games"],
    d: ["Lightweight mod loader server.", "Yengil mod yuklovchi server.", "Лёгкий сервер с загрузчиком модов."],
    v: [["1.20.1", "https://meta.fabricmc.net/v2/versions/loader/1.20.1/0.18.4/1.1.1/server/jar", "", "JAR"]],
  },
  {
    id: "steam", title: "Steam", s: "games", c: ["windows", "games"],
    d: ["The biggest PC game store and launcher.", "Eng katta kompyuter o‘yinlari do‘koni.", "Крупнейший магазин и лаунчер игр для ПК."],
    url: "https://store.steampowered.com/about/",
  },
  {
    id: "epic-games", title: "Epic Games Launcher", s: "games", c: ["windows", "games"],
    d: ["Epic Games store and launcher.", "Epic Games do‘koni va launcheri.", "Магазин и лаунчер Epic Games."],
    url: "https://www.epicgames.com/store/download",
  },
  {
    id: "gog-galaxy", title: "GOG Galaxy", s: "games", c: ["windows", "games"],
    d: ["Client for DRM-free games.", "DRM’siz o‘yinlar uchun mijoz.", "Клиент для игр без DRM."],
    url: "https://www.gog.com/galaxy",
  },
  {
    id: "nvidia-app", title: "NVIDIA App", s: "games", c: ["windows", "games"],
    d: [
      "GPU drivers and game settings (replaced GeForce Experience).",
      "Videokarta drayverlari va o‘yin sozlamalari (GeForce Experience o‘rnini bosdi).",
      "Драйверы видеокарты и настройки игр (заменил GeForce Experience).",
    ],
    url: "https://www.nvidia.com/en-us/software/nvidia-app/",
  },
];

function kindOf(url) {
  if (/^https?:\/\/t\.me\//i.test(url)) return "TG";
  const ext = url.split(/[?#]/)[0].match(/\.(exe|msi|iso|img|apk|jar|sh|zip)$/i);
  return ext ? ext[1].toUpperCase() : "WEB";
}

function toVersion([label, url, size = "", type]) {
  return { label, url, size, type: type || kindOf(url) };
}

// Jadvaldagi materiallar bilan bir xil shakl — MaterialCard ikkalasini ham chiza oladi
export const EXTRA_APPS = RAW.map((app) => {
  const versions = (app.v || [["", app.url]]).map(toVersion);
  const [en, uz, ru] = app.d;
  return {
    id: `ya-${app.id}`,
    title: app.title,
    description: en,
    descriptions: { en, uz, ru },
    categories: app.c,
    tags: [],
    gallery_urls: [],
    file_url: versions[0].url,
    file_type: versions[0].type,
    size_mb: "",
    version: versions[0].label,
    platform: "",
    author: "",
    preview_url: "",
    post_link: "",
    channel_ID: "",
    created_at: "",
    source: "extra",
    section: app.s,
    versions,
  };
});
