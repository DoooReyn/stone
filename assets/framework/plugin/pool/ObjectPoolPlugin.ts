import { Constructor } from 'cc';
import { PRESET_TOKEN } from 'fast/config/Token';
import { FastError } from 'fast/foundation/Error';
import { Plugin } from 'fast/foundation/Plugin';
import { Pair } from 'fast/Types';

import { IObjectEntry } from './IObjectEntry';
import { IObjectPoolPlugin } from './IObjectPoolPlugin';
import { IRecyclableOptions } from './IRecycleable';
import { ObjectEntry } from './ObjectEntry';
import { IObjectPool, ObjectPool } from './ObjectPool';

/**
 * 对象池容器插件
 */
export class ObjectPoolPlugin extends Plugin implements IObjectPoolPlugin {
  public static readonly Token = PRESET_TOKEN.OBJECT_POOL;

  /** 池子容器 */
  private _container: Map<string, Pair<IObjectPool<IObjectEntry>, Constructor<IObjectEntry>>> = new Map();

  /**
   * 注册对象池
   * @param cls 对象构造函数
   * @param options 池子配置
   */
  register(cls: Constructor<ObjectEntry>, options: IRecyclableOptions): void {
    const token = options.token;

    if (this._container.has(token)) {
      throw new FastError(this.token, `对象池⁅${token}⁆重复注册`);
    }

    this._container.set(token, [new ObjectPool(cls, options), cls]);
  }

  /**
   * 注销对象池
   * @param cls 对象构造函数或池子标记
   */
  unregister(cls: Constructor<IObjectEntry> | string): void {
    if (typeof cls === 'string') {
      if (this._container.has(cls)) {
        if (this._container.delete(cls)) {
          this.logger.d(`对象池⁅${cls}⁆已注销`);
        }
      }
    } else {
      for (let [token, pair] of this._container) {
        if (cls === pair[1]) {
          this._container.delete(token);
          this.logger.d(`对象池⁅${token}⁆已注销`);
          break;
        }
      }
    }
  }

  /**
   * 检查对象池是否存在
   * @param cls 对象构造函数或池子标记
   * @returns 是否存在
   */
  has(cls: Constructor<IObjectEntry> | string): boolean {
    if (typeof cls === 'string') {
      return this._container.has(cls);
    }

    for (let [, pair] of this._container) {
      if (cls === pair[1]) {
        return true;
      }
    }

    return false;
  }

  /**
   * 获取对象池
   * @param cls 对象构造函数或池子标记
   * @returns 对象池实例
   */
  poolOf<T extends IObjectEntry>(cls: Constructor<T> | string): IObjectPool<T> {
    let token = '';

    if (typeof cls === 'string') {
      token = cls;
    } else {
      for (let [key, pair] of this._container) {
        if (cls === pair[1]) {
          token = key;
          break;
        }
      }
    }

    if (!this._container.has(token)) {
      throw new FastError(this.token, `对象池⁅${token}⁆未注册`);
    }

    return this._container.get(token)![0] as IObjectPool<T>;
  }

  /**
   * 从对象池获取实例
   * @param cls 对象构造函数
   * @param args 初始化参数
   * @returns 对象实例
   */
  acquire<T extends IObjectEntry>(cls: Constructor<T>, ...args: any[]): T | undefined {
    const inst = this.poolOf(cls);

    if (inst === undefined) {
      throw new FastError(this.token, `对象池⁅${cls.name}⁆未注册`);
    }

    return inst.acquire(...args) as T;
  }

  /**
   * 回收对象实例到池子
   * @param instance 要回收的对象实例
   */
  recycle<T extends IObjectEntry>(instance: T): void {
    if (instance && instance.token !== undefined && instance.recycle !== undefined) {
      if (!this._container.has(instance.token)) {
        throw new FastError(this.token, `对象池⁅${instance.token}⁆未注册`);
      }

      this._container.get(instance.token)![0].recycle(instance);
      this.logger.d(`对象池⁅${instance.token}⁆条目已回收`);
    }
  }

  /**
   * 清理所有池子中过期未使用的对象
   */
  clearUnused(): void {
    this._container.forEach((v) => v[0].clearUnused());
  }

  /**
   * 清空所有池子
   */
  clear(): void {
    this._container.forEach((p) => p[0].clear());
  }
}
