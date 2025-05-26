import path from "path";

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
  HIDDIFY_WIN = "Hiddify windows",

  // macOS
  V2RAY_TUN_MAC="V2RayTun mac",
  V2RAYX = "V2RayX",
  CLASHX = "ClashX",
  SINGBOX_MAC = "sing-box",

  // Linux
  V2RAY_LINUX = "v2ray",
  SINGBOX_LINUX = "sing-box linux",
  CLASH_LINUX = "Clash",

  // iOS
  V2RAY_TUN_IOS="V2RayTun ios",
  HIDDIFY_IOS="Hiddify ios",
  SHADOWROCKET = "Shadowrocket",
  STASH = "Stash",
  SINGBOX_IOS = "sing-box ios",

  // Android
  V2RAYNG = "V2RayNG",
  V2RAY_TUN_ANDROID="V2RayTun android",
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
  steps: InstructionStep[]
  downloadLink: string;
  key: ClientKey;
}

export interface InstructionStep {
  number: number;
  name: string;
  text: string;
  images: string[]
}

export interface LabeledPrice {
  label: string
  amount: number
  key: string
}

export const osList: Os[] = [
  { name: "🤖 Android", key: OSKey.ANDROID },
  { name: "📱 IPhone", key: OSKey.IOS },
  { name: "🪟 Windows 10/11", key: OSKey.WINDOWS },
  { name: "💻MacOS", key: OSKey.MAC },
  { name: "🐧Linux", key: OSKey.LINUX },
]

export const clients: Client[] = [
  { name: "V2RayTun", key: ClientKey.V2RAY_TUN_IOS, os: OSKey.IOS },
  { name: "Hiddify Proxy & VPN", key: ClientKey.HIDDIFY_IOS, os: OSKey.IOS },
  { name: "Hiddify Proxy & VPN", key: ClientKey.HIDDIFY_WIN, os: OSKey.WINDOWS },
  // { name: "V2RayN", key: ClientKey.V2RAYN, os: OSKey.WINDOWS },
  // { name: "Clash for Windows", key: ClientKey.CLASHWIN, os: OSKey.WINDOWS },
  // { name: "V2RayX", key: ClientKey.V2RAYX, os: OSKey.MAC },
  // { name: "ClashX", key: ClientKey.CLASHX, os: OSKey.MAC },
  // { name: "sing-box", key: ClientKey.SINGBOX_MAC, os: OSKey.MAC },
  // { name: "v2ray", key: ClientKey.V2RAY_LINUX, os: OSKey.LINUX },
  // { name: "sing-box", key: ClientKey.SINGBOX_LINUX, os: OSKey.LINUX },
  // { name: "Clash", key: ClientKey.CLASH_LINUX, os: OSKey.LINUX },
  // { name: "Shadowrocket", key: ClientKey.SHADOWROCKET, os: OSKey.IOS },
  // { name: "Stash", key: ClientKey.STASH, os: OSKey.IOS },
  // { name: "sing-box", key: ClientKey.SINGBOX_IOS, os: OSKey.IOS },
  { name: "V2RayNG", key: ClientKey.V2RAYNG, os: OSKey.ANDROID },
  { name: "v2RayTun", key: ClientKey.V2RAY_TUN_ANDROID, os: OSKey.ANDROID },
  // { name: "Clash for Android", key: ClientKey.CLASH_ANDROID, os: OSKey.ANDROID },
  // { name: "sing-box", key: ClientKey.SINGBOX_ANDROID, os: OSKey.ANDROID }
];

export const instructions: Instruction[] = [
  {
    downloadLink: "https://play.google.com/store/apps/details?id=com.v2ray.ang&pcampaignid=web_share",
    text: "V2RayNg",
    key: ClientKey.V2RAYNG,
    steps: [
      {
        number: 1,
        name: "Установка приложения",
        text: "Скачай <b>V2RayNG</b> из Google Play.",
        images: [path.join(process.cwd(), 'assets', 'instructions', 'v2rayng-android', 'step-1.png')]
      },
      {
        number: 2,
        name: "Добавление конфигурации",
        text: `- Открой приложение → нажми "+" → выбери "Scan QR Code" или "Import Config".\n- Введи ссылку VLess, полученную из бота.`,
        images: [path.join(process.cwd(), 'assets', 'instructions', 'v2rayng-android', 'step-2.png')]
      },
      {
        number: 3,
        name: "Подключение к VPN",
        text: `- Выбери импортированный профиль.\n- Нажми кнопку "Start" для подключения.`,
        images: []
      },
    ]
  },
  {
    downloadLink: "https://play.google.com/store/apps/details?id=com.v2raytun.android&pcampaignid=web_share",
    text: "v2RayTun",
    key: ClientKey.V2RAY_TUN_ANDROID,
    steps: [
      {
        number: 1,
        name: "Установка приложения",
        text: "Скачай <b>V2RayTun</b> из Google Play.",
        images: [path.join(process.cwd(), 'assets', 'instructions', 'v2raytun-android', 'step-1.png')]
      },
      {
        number: 2,
        name: "Добавление конфигурации",
        text: `- Открой приложение → нажми "+" → выбери "Import from URL" или "Scan QR Code".\n- Введи ссылку VLess, полученную из бота.`,
        images: [path.join(process.cwd(), 'assets', 'instructions', 'v2raytun-android', 'step-2.png')]
      },
      {
        number: 3,
        name: "Подключение к VPN",
        text: `- Выбери импортированный профиль.\n- Нажми кнопку "Start" для подключения.`,
        images: []
      },
    ]
  },
  {
    downloadLink: "https://apps.apple.com/ru/app/v2raytun/id6476628951",
    text: "v2RayTun",
    key: ClientKey.V2RAY_TUN_IOS,
    steps: [
      {
        number: 1,
        name: "Установка приложения",
        text: "Скачай <b>V2RayTun</b> из App Store.",
        images: [path.join(process.cwd(), 'assets', 'instructions', 'v2raytun-ios', 'step-1.png')]
      },
      {
        number: 2,
        name: "Добавление конфигурации",
        text: `- Нажми "+" → выбери "Добавить из буфера".\n- Вставь ссылку VLess, полученную из бота в буфер обмена.`,
        images: [path.join(process.cwd(), 'assets', 'instructions', 'v2raytun-ios', 'step-2.png')]
      },
      {
        number: 3,
        name: "Подключение к VPN",
        text: `- Выбери импортированный профиль.\n- Нажми кнопку "Start" для подключения.`,
        images: []
      },
    ]
  },
  {
    downloadLink: "https://apps.apple.com/ru/app/hiddify-proxy-vpn/id6596777532",
    text: "Hiddify Proxy & VPN",
    key: ClientKey.HIDDIFY_IOS,
    steps: [
      {
        number: 1,
        name: "Установка приложения",
        text: "Скачай <b>Hiddify</b> из App Store.",
        images: [path.join(process.cwd(), 'assets', 'instructions', 'hiddify-ios', 'step-1.png')]
      },
      {
        number: 2,
        name: "Добавление конфигурации",
        text: `- Открой приложение\n - Нажми "+" → выбери "Добавить из буфера обмена"\n- Вставь VLess-ссылку или загрузи конфигурационный файл.`,
        images: [path.join(process.cwd(), 'assets', 'instructions', 'hiddify-ios', 'step-2.png')]
      },
      {
        number: 3,
        name: "Подключение к VPN",
        text: `- Выбери импортированный профиль.\n- Нажми кнопку "Start" для подключения.`,
        images: []
      },
    ]
  },
  {
    downloadLink: "https://hiddify.com/",
    text: "Hiddify Proxy & VPN",
    key: ClientKey.HIDDIFY_WIN,
    steps: [
      {
        number: 1,
        name: "Установка приложения",
        text: "Скачай <b>Hiddify</b> с официального сайта.",
        images: []
      },
      {
        number: 2,
        name: "Инструкция в разработке",
        text: "😟 <i>К сожалению, мы еще не успели расписать подробные шаги подключения к VPN через Hiddify. Но не растраивайтесь, скоро сделаем 😅. Вы справитесь!</i> 💪 Там всё просто.",
        images: []
      },
    ]
  }
];

export const stagePrices: LabeledPrice[] = [
  {
    label: "Пробная подписка на 3 дня",
    amount: 0,
    key: "trial"
  },
  {
    label: "1 месяц подписки",
    amount: 11 * 100,
    key: "1m",
  },
  {
    label: "3 месяца подписки",
    amount: 11 * 100,
    key: "3m",
  },
  {
    label: "6 месяцев подписки",
    amount: 11 * 100,
    key: "6m",
  },
  {
    label: "12 месяцев подписки",
    amount: 11 * 100,
    key: "12m",
  }
]

export const prodPrices: LabeledPrice[] = [
  {
    label: "Пробная подписка на 3 дня",
    amount: 0,
    key: "trial"
  },
  {
    label: "1 месяц подписки",
    amount: 79 * 100,
    key: "1m",
  },
  {
    label: "3 месяца подписки",
    amount: 219 * 100,
    key: "3m",
  },
  {
    label: "6 месяцев подписки",
    amount: 419 * 100,
    key: "6m",
  },
  {
    label: "12 месяцев подписки",
    amount: 799 * 100,
    key: "12m",
  }
]

const getPrices = (): LabeledPrice[] => {
  if (process.env.PRODUCTION === "true")
    return prodPrices
  return stagePrices
}

export const prices: LabeledPrice[] = getPrices()
