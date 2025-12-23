import { __private } from 'cc';

/** 无返回值函数类型 */
export type VoidFn = (...args: any[]) => void;

/** 字典类型 */
export type Dict = Record<string | symbol, any>;

/** 字典键类型 */
export type Key = string | symbol;

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
