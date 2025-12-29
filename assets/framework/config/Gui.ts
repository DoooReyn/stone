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
    text: '',
    family: '霞鹜臻楷 GB',
    color: '#FFFFFF',
    size: 20,
    multiline: false,
    bold: false,
    italic: false,
    underline: false,
    outline: {
      color: '#FFFFFF',
      width: 2,
    },
    shadow: {
      color: '#FFFFFF',
      x: 2,
      y: -2,
      blur: 2,
    },
    alignHor: 1,
    alignVer: 1,
    overflow: 0,
    cacheMode: 0,
  },
} as const;
