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
  /** 字体切换事件 */
  FONT_CHANGED: 'gui:font-changed',
  /** 按钮：点击开始 */
  BTN_CLICK_START: 'gui:button-click-start',
  /** 按钮：点击结束 */
  BTN_CLICK_END: 'gui:button-click-end',
  /** 按钮：点击取消 */
  BTN_CLICK_CANCEL: 'gui:button-click-cancel',
  /** 按钮：鼠标进入 */
  BTN_HOVER_IN: 'gui:button-hover-in',
  /** 按钮：鼠标移出 */
  BTN_HOVER_OUT: 'gui:button-hover-out',
  /** 按钮：长按开始 */
  BTN_HOLD_START: 'gui:button-hold-start',
  /** 按钮：长按结束 */
  BTN_HOLD_END: 'gui:button-hold-end',
  /** 按钮：长按触发 */
  BTN_HOLD_COUNT: 'gui:button-hold-count',
  /** 按钮：状态切换 */
  BTN_STATE_CHANGED: 'gui:button-state-changed',
};
