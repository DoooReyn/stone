import { __private } from 'cc';

type ScreenEvent = __private._pal_screen_adapter_enum_type_screen_event__PalScreenEvent;

/** 框架内置事件渠道标识 */
export const PRESET_EVENT_CHANNEL = {
  SHARED: 'shared',
  APP: 'app',
  GUI: 'gui',
  RED: 'red',
} as const;

/** 框架内置事件名称 */
export const PRESET_EVENT_NAME = {
  // ---------------- APP ----------------

  /** 应用语种变化 */
  LANGUAGE_CHANGED: 'app:language-changed',
  /** 应用进入前台 */
  ENTER_FOREGROUND: 'app:enter-foreground',
  /** 应用进入后台 */
  ENTER_BACKGROUND: 'app:enter-background',
  /** 应用退出 */
  EXIT: 'app:exit',
  /** 应用内存不足 */
  LOW_MEMORY: 'app:low-memory',
  /** 应用窗口尺寸变化 */
  SCREEN_SIZE_CHANGED: 'window-resize' as ScreenEvent,
  /** 应用全屏状态变化 */
  SCREEN_FULL_CHANGED: 'fullscreen-change' as ScreenEvent,
  /** 应用设备朝向变化 */
  SCREEN_ORIENTATION_CHANGED: 'orientation-change' as ScreenEvent,

  // ---------------- RED ----------------

  /** 红点状态切换 */
  RED_STATE_CHANGED: 'red:state-changed',

  // ---------------- GUI ----------------

  /** 应用屏幕点击 */
  SCREEN_TAPPED: 'gui:screen-tapped',
  /** 红点变化 */
  RED_DOT_CHANGED: 'gui:red-dot-changed@',
  /** 弹窗层遮罩点击事件 */
  POPUP_MASK_CLICKED: 'gui:popup-mask-clicked',
  /** 弹窗层遮罩点击事件 */
  ALERT_MASK_CLICKED: 'gui:alert-mask-clicked',
};
