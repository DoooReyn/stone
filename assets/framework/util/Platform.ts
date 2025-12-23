import { sys } from 'cc';

// endian
export const littleEndian = sys.isLittleEndian;

// os
export const os = sys.os;
export const macos = sys.OS.OSX === os;
export const windows = sys.OS.WINDOWS === os;
export const linux = sys.OS.LINUX === os;
export const ios = sys.OS.IOS === os;
export const android = sys.OS.ANDROID === os;
export const ohos = sys.OS.OHOS === os;

// device
export const native = sys.isNative;
export const mobile = sys.isMobile;
export const browser = sys.isBrowser;
export const desktop = macos || windows || linux;

// native
export const mobileNative = mobile && native;
export const desktopNative = desktop && native;
export const iosNative = ios && native;
export const androidNative = android && native;
export const ohosNative = ohos && native;

// browser
export const mobileBrowser = mobile && browser;
export const desktopBrowser = desktop && browser;
export const iosBrowser = ios && browser;
export const androidBrowser = android && browser;
export const ohosBrowser = ohos && browser;

// platform
export const platform = sys.platform;
export const weixin = platform === sys.Platform.WECHAT_GAME;
export const huawei = platform === sys.Platform.HUAWEI_QUICK_GAME;
export const alipay = platform === sys.Platform.ALIPAY_MINI_GAME;
export const xiaomi = platform === sys.Platform.XIAOMI_QUICK_GAME;
export const douyin = platform === sys.Platform.BYTEDANCE_MINI_GAME;
export const taobao = platform === sys.Platform.TAOBAO_MINI_GAME;
export const honor = platform === sys.Platform.HONOR_MINI_GAME;
export const oppo = platform === sys.Platform.OPPO_MINI_GAME;
export const vivo = platform === sys.Platform.VIVO_MINI_GAME;
