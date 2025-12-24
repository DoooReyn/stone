import { Constructor } from 'cc';
import { IPlugin } from 'fast/foundation/Plugin';

import { IObjectEntry } from './IObjectEntry';
import { IRecyclableOptions } from './IRecycleable';
import { IObjectPool } from './ObjectPool';

/**
 * 对象池插件接口
 */
export interface IObjectPoolPlugin extends IPlugin {
  /**
   * 注册对象池
   * @param cls 对象构造函数
   * @param options 池子配置
   */
  register(cls: Constructor<IObjectEntry>, options: IRecyclableOptions): void;

  /**
   * 注销对象池
   * @param cls 对象构造函数或池子标记
   */
  unregister(cls: Constructor<IObjectEntry> | string): void;

  /**
   * 检查对象池是否存在
   * @param cls 对象构造函数或池子标记
   * @returns 是否存在
   */
  has(cls: Constructor<IObjectEntry> | string): boolean;

  /**
   * 获取对象池
   * @param cls 对象构造函数或池子标记
   * @returns 对象池实例
   */
  poolOf<T extends IObjectEntry>(cls: Constructor<T> | string): IObjectPool<T>;

  /**
   * 从对象池获取实例
   * @param cls 对象构造函数
   * @param args 初始化参数
   * @returns 对象实例
   */
  acquire<T extends IObjectEntry>(cls: Constructor<T>, ...args: any[]): T | undefined;

  /**
   * 回收对象实例到池子
   * @param instance 要回收的对象实例
   */
  recycle<T extends IObjectEntry>(instance: T): void;

  /**
   * 清理所有池子中过期未使用的对象
   */
  clearUnused(): void;

  /**
   * 清空所有池子
   */
  clear(): void;
}
