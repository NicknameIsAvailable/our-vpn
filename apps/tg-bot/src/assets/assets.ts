export enum OSKey {
  ANDROID = "android",
  IOS = "ios",
  WINDOWS = "windows",
  MAC = "mac",
  LINUX = "linux",
}

export enum ClientKey {
  // Windows
  V2RAYN = "V2RayN",
  CLASHWIN = "Clash for Windows",

  // macOS
  V2RAYX = "V2RayX",
  CLASHX = "ClashX",
  SINGBOX_MAC = "sing-box",

  // Linux
  V2RAY_LINUX = "v2ray",
  SINGBOX_LINUX = "sing-box linux",
  CLASH_LINUX = "Clash",

  // iOS
  SHADOWROCKET = "Shadowrocket",
  STASH = "Stash",
  SINGBOX_IOS = "sing-box ios",

  // Android
  V2RAYNG = "V2RayNG",
  CLASH_ANDROID = "Clash for Android",
  SINGBOX_ANDROID = "sing-box android"
}

export interface Os {
  name: string;
  key: OSKey
}

export interface Client {
  name: string
  key: ClientKey
  os: OSKey
}

export interface Instruction {
  text: string;
  downloadLink: string;
  key: ClientKey;
}

export interface LabeledPrice {
  label: string
  amount: number
  key: string
}

export const osList: Os[] = [
  { name: "Android", key: OSKey.ANDROID },
  { name: "IPhone", key: OSKey.IOS },
  { name: "Windows 10/11", key: OSKey.WINDOWS },
  { name: "MacOS", key: OSKey.MAC },
  { name: "Linux", key: OSKey.LINUX },
]

export const clients: Client[] = [
  { name: "V2RayN", key: ClientKey.V2RAYN, os: OSKey.WINDOWS },
  { name: "Clash for Windows", key: ClientKey.CLASHWIN, os: OSKey.WINDOWS },
  { name: "V2RayX", key: ClientKey.V2RAYX, os: OSKey.MAC },
  { name: "ClashX", key: ClientKey.CLASHX, os: OSKey.MAC },
  { name: "sing-box", key: ClientKey.SINGBOX_MAC, os: OSKey.MAC },
  { name: "v2ray", key: ClientKey.V2RAY_LINUX, os: OSKey.LINUX },
  { name: "sing-box", key: ClientKey.SINGBOX_LINUX, os: OSKey.LINUX },
  { name: "Clash", key: ClientKey.CLASH_LINUX, os: OSKey.LINUX },
  { name: "Shadowrocket", key: ClientKey.SHADOWROCKET, os: OSKey.IOS },
  { name: "Stash", key: ClientKey.STASH, os: OSKey.IOS },
  { name: "sing-box", key: ClientKey.SINGBOX_IOS, os: OSKey.IOS },
  { name: "V2RayNG", key: ClientKey.V2RAYNG, os: OSKey.ANDROID },
  { name: "Clash for Android", key: ClientKey.CLASH_ANDROID, os: OSKey.ANDROID },
  { name: "sing-box", key: ClientKey.SINGBOX_ANDROID, os: OSKey.ANDROID }
];

export const instructions: Instruction[] = [
  {
    key: ClientKey.V2RAYN,
    text: "1. Скачайте и установите V2RayN\n2. Запустите приложение\n3. Импортируйте конфигурацию (QR-код или URL)\n4. Включите прокси и проверьте подключение",
    downloadLink: "https://github.com/2dust/v2rayN/releases",
  },
  {
    key: ClientKey.CLASHWIN,
    text: "1. Скачайте и установите Clash for Windows\n2. Запустите приложение\n3. Импортируйте конфигурацию (URL)\n4. Включите прокси и выберите режим",
    downloadLink: "https://github.com/Fndroid/clash_for_windows_pkg/releases",
  },
  {
    key: ClientKey.V2RAYX,
    text: "1. Скачайте и установите V2RayX\n2. Откройте приложение и добавьте конфигурацию\n3. Включите прокси",
    downloadLink: "https://github.com/Cenmrev/V2RayX/releases",
  },
  {
    key: ClientKey.CLASHX,
    text: "1. Скачайте и установите ClashX\n2. Запустите приложение и добавьте конфигурацию (URL)\n3. Включите прокси",
    downloadLink: "https://github.com/yichengchen/clashX/releases",
  },
  {
    key: ClientKey.SINGBOX_MAC,
    text: "1. Скачайте и установите sing-box\n2. Откройте терминал и запустите клиента\n3. Импортируйте конфигурацию и подключитесь",
    downloadLink: "https://github.com/SagerNet/sing-box/releases",
  },
  {
    key: ClientKey.V2RAY_LINUX,
    text: "1. Скачайте V2Ray для Linux\n2. Разархивируйте и установите\n3. Импортируйте конфигурацию\n4. Запустите клиент через терминал",
    downloadLink: "https://github.com/v2fly/v2ray-core/releases",
  },
  {
    key: ClientKey.SINGBOX_LINUX,
    text: "1. Скачайте sing-box для Linux\n2. Разархивируйте и установите\n3. Импортируйте конфигурацию\n4. Запустите клиент через терминал",
    downloadLink: "https://github.com/SagerNet/sing-box/releases",
  },
  {
    key: ClientKey.CLASH_LINUX,
    text: "1. Скачайте Clash для Linux\n2. Разархивируйте и установите\n3. Импортируйте конфигурацию\n4. Запустите клиент через терминал",
    downloadLink: "https://github.com/Dreamacro/clash/releases",
  },
  {
    key: ClientKey.SHADOWROCKET,
    text: "1. Установите Shadowrocket из App Store\n2. Добавьте конфигурацию через URL или QR-код\n3. Включите прокси",
    downloadLink: "https://apps.apple.com/app/shadowrocket/id932747118",
  },
  {
    key: ClientKey.STASH,
    text: "1. Установите Stash из App Store\n2. Импортируйте конфигурацию\n3. Включите прокси",
    downloadLink: "https://apps.apple.com/app/stash-rule-based-proxy/id1596063349",
  },
  {
    key: ClientKey.SINGBOX_IOS,
    text: "1. Установите sing-box на iOS через TestFlight\n2. Импортируйте конфигурацию\n3. Подключитесь",
    downloadLink: "https://github.com/SagerNet/sing-box/releases",
  },
  {
    key: ClientKey.V2RAYNG,
    text: "1. Скачайте и установите V2RayNG\n2. Добавьте конфигурацию (QR-код или URL)\n3. Включите прокси",
    downloadLink: "https://github.com/2dust/v2rayNG/releases",
  },
  {
    key: ClientKey.CLASH_ANDROID,
    text: "1. Скачайте и установите Clash for Android\n2. Добавьте конфигурацию (URL)\n3. Включите прокси",
    downloadLink: "https://github.com/Kr328/ClashForAndroid/releases",
  },
  {
    key: ClientKey.SINGBOX_ANDROID,
    text: "1. Установите sing-box на Android\n2. Импортируйте конфигурацию\n3. Включите прокси",
    downloadLink: "https://github.com/SagerNet/sing-box/releases",
  }
];

export const prices: LabeledPrice[] = [
  {
    label: "1 месяц подписки",
    amount: 69 * 100,
    key: "1m",
  },
  {
    label: "3 месяца подписки",
    amount: 165 * 100,
    key: "3m",
  },
  {
    label: "6 месяцев подписки",
    amount: 330 * 100,
    key: "6m",
  },
  {
    label: "12 месяцев подписки",
    amount: 660 * 100,
    key: "12m",
  }
]
