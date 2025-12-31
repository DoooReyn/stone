import {
  __private,
  CacheMode,
  Enum,
  HorizontalTextAlignment,
  Overflow,
  SpriteAtlas,
  Vec2,
  VerticalTextAlignment,
} from 'cc';

/** 无返回值函数类型 */
export type VoidFn = (...args: any[]) => void;

/** 任意函数 */
export type AnyFn = (...args: any[]) => any;

/** 任意异步函数 */
export type AnyPromise = (...args: any[]) => Promise<any>;

/** 字典键类型 */
export type Key = string | symbol;

/** 字典类型 */
export type Dict = Record<Key, any>;

/** 固定数据的字典类型 */
export type DictOf<V = any> = Record<Key, V>;

/** 全局变量 */
export type Global = Dict & (typeof Window | typeof globalThis);

/** 构造器 */
export type Constructor<T = unknown> = new (...args: any[]) => T;

/** 键值对元组 */
export type Pair<K, V> = [K, V];

/** 键值对元组数组 */
export type Pairs<K, V> = Pair<K, V>[];

/** （可指定长度的）元组 */
export type Tuple<T, L = number> = T[] & { length: L };

/** 纹理原始信息 */
export type IMemoryImageSource = __private._cocos_asset_assets_image_asset__IMemoryImageSource;

/** 数据传输对象 */
export interface Dto {}

/** 数据属性变化回调 */
export type OnPropertyChanged = (path: string, value: any) => void;

/** 订阅结构 */
export type Subscription = Pair<OnPropertyChanged, any>;

/** 文本属性 */
export interface ITextAttr {
  /** 文本内容 */
  text: string;
  /** 字体族，系统字体直接使用名称，资源字体使用 'l:' 前缀 */
  family: string;
  /** 字号 */
  size: number;
  /** 颜色，十六进制格式 */
  color: string;
  /** 是否多行 */
  multiline: boolean;
  /** 加粗 */
  bold: boolean;
  /** 倾斜 */
  italic: boolean;
  /** 下划线 */
  underline: boolean;
  /** 描边 */
  outline: {
    /** 颜色，十六进制格式 */
    color: string;
    /** 宽度，0 表示禁用 */
    width: number;
  };
  /** 阴影 */
  shadow: {
    /** 颜色，十六进制格式 */
    color: string;
    /** X 轴偏移 */
    x: number;
    /** Y 轴偏移 */
    y: number;
    /** 模糊半径，0 表示禁用 */
    blur: number;
  };
  /** 水平对齐 */
  alignHor: HorizontalTextAlignment;
  /** 垂直对齐 */
  alignVer: VerticalTextAlignment;
  /** 溢出处理 */
  overflow: Overflow;
  /** 缓存模式 */
  cacheMode: CacheMode;
}

/** 图像属性 */
export interface IImageAttr {
  /** 显示模式 */
  viewMode: __private._cocos_2d_components_sprite__SpriteType;
  /** 尺寸模式 */
  sizeMode: __private._cocos_2d_components_sprite__SizeMode;
  /** 填充模式 */
  fillMode: __private._cocos_2d_components_sprite__FillType;
  /** 填充起点 */
  fillStart: number;
  /** 填充范围 */
  fillRange: number;
  /** 填充中心 */
  fillCenter: Vec2;
  /** 灰度模式 */
  gray: boolean;
}

/** 输入框属性 */
export interface ITextFieldAttr {
  text: string;
  tip: string;
  maxLength: number;
  returnMode: __private._cocos_ui_editbox_types__KeyboardReturnType;
  inputMode: __private._cocos_ui_editbox_types__InputMode;
  inputFlag: __private._cocos_ui_editbox_types__InputFlag;
}

/** 富文本属性 */
export interface ITextRichAttr {
  /** 文本内容 */
  text: string;
  /** 字体族，系统字体直接使用名称，资源字体使用 'l:' 前缀 */
  family: string;
  /** 字号 */
  size: number;
  /** 颜色，十六进制格式 */
  color: string;
  /** 行高 */
  lineHeight: number;
  /** 水平对齐 */
  alignHor: HorizontalTextAlignment;
  /** 垂直对齐 */
  alignVer: VerticalTextAlignment;
  /** 缓存模式 */
  cacheMode: CacheMode;
  /** 图集 */
  atlas: SpriteAtlas;
  /** 最大宽度 */
  maxWidth: number;
  /** 防止触摸穿透 */
  preventTouch: boolean;
}

/**
 * 加载状态
 */
export enum LoadState {
  /** 未加载 */
  Init,
  /** 加载中 */
  Loading,
  /** 加载成功 */
  Ok,
  /** 加载失败 */
  Bad,
}

/**
 * 适配模式
 */
export enum ImageFitMode {
  /** 不适配，显示区域=图片尺寸，以图片尺寸为准 */
  None,
  /** 按区域适配，显示区域=图片尺寸，以显示区域为准 */
  Area,
  /** 按宽度适配，高度进行等比适配 */
  Width,
  /** 按高度适配，宽度进行等比适配 */
  Height,
}

/**
 * 适配模式
 */
export const CCImageFitMode = Enum(ImageFitMode);
