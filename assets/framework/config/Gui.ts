/** 框架内置 GUI 参数 */
export const PRESET_GUI = {
  /** 启动场景根节点名称 */
  ROOT: 'root',
  /** 启动场景2D相机名称 */
  CAMERA_2D: 'camera-2d',
  /** 每次点击最短间隔时间（毫秒） */
  CLICK_INTERVAL_MS: 200,
  /** 默认字体 */
  TEXT_FONT: {
    family: 'l:resources@font/default',
    color: '#FFFFFF',
    size: 20,
    lineHeight: 24,
    autoWrap: false,
  },
  TEXT_DECOR: {
    bold: false,
    italic: false,
    underline: false,
  },
  TEXT_OUTLINE: {
    color: '#FFFFFF',
    width: 2,
  },
  TEXT_SHADOW: {
    color: '#FFFFFF',
    x: 2,
    y: -2,
    blur: 2,
  },
  /** 默认对齐方式 */
  TEXT_ALIGNMENT: {
    h: 0,
    v: 1,
  },
  /** 默认溢出处理 */
  TEXT_OVERFLOW: 0,
  /** 默认缓存模式 */
  TEXT_CACHE_MODE: 0,
} as const;
