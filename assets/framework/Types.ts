import { __private, CacheMode, HorizontalTextAlignment, Overflow, VerticalTextAlignment } from 'cc';

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

/**
 * 文本样式
 */
export interface ITextStyle {
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
