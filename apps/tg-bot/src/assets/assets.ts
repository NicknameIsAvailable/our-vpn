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
  steps: InstructionStep[]
  downloadLink: string;
  key: ClientKey;
}

export interface InstructionStep {
  number: number;
  name: string;
  text: string;
  imageUrls: string[]
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
  { name: "V2RayTun", key: ClientKey.V2RAY_TUN_MAC, os: OSKey.MAC }
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
  // { name: "V2RayNG", key: ClientKey.V2RAYNG, os: OSKey.ANDROID },
  // { name: "Clash for Android", key: ClientKey.CLASH_ANDROID, os: OSKey.ANDROID },
  // { name: "sing-box", key: ClientKey.SINGBOX_ANDROID, os: OSKey.ANDROID }
];

export const instructions: Instruction[] = [

];

export const prices: LabeledPrice[] = [
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
