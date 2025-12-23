import { Constructor } from 'cc';

import { PRESET_TOKEN } from '../../config';
import { FastError, IPlugin, Plugin } from '../../foundation';
import { Pair } from '../../Types';
import { time } from '../../util';
import { IObjectEntry } from './IObjectEntry';
import { IRecyclableOptions } from './IRecycleable';

/**
 * 对象条目
 */
export abstract class ObjectEntry implements IObjectEntry {
  token: string;
  createdAt: number = 0;
  recycledAt: number = 0;

  get initialized(): boolean {
    return this.createdAt > 0;
  }

  get destroyed(): boolean {
    return this.recycledAt > 0;
  }

  /**
   * 初始化对象
   * @param args 初始化参数
   */
  initialize(...args: any[]): void {
    if (!this.initialized) {
      this.reset();
      this.createdAt = time.now();
      this.recycledAt = 0;
      this.onInitialize(...args);
    }
  }

  /**
   * 回收对象
   * @returns 回收是否成功
   */
  recycle(): boolean {
    if (!this.destroyed) {
      this.recycledAt = time.now();
      this.createdAt = 0;
      this.onRecycled();
      return true;
    }
    return false;
  }

  /**
   * 重置对象状态
   */
  reset(): void {}

  abstract onInitialize(...args: any[]): void;

  abstract onRecycled(): void;
}

/**
 * 对象池
 */
export class ObjectPool<T extends ObjectEntry> {
  /** 条目列表 */
  private readonly _container: T[];

  /**
   * 构造函数
   * @param construct 对象池条目构造
   * @param options 对象池条目配置
   */
  constructor(public readonly construct: Constructor<T>, public readonly options: IRecyclableOptions) {
    this._container = [];
    this.fill(this.options.expands);
  }

  /** 标识 */
  get token() {
    return this.options.token;
  }

  /** 过期时间 */
  get expires() {
    return this.options.expires;
  }

  /** 扩容数量 */
  get expands() {
    return this.options.expands;
  }

  /** 容量限制 */
  get capacity() {
    return this.options.capacity;
  }

  /** 当前数量 */
  get size(): number {
    return this._container.length;
  }

  /**
   * 填充池子
   * @param n 目标数量
   */
  fill(n: number): void {
    if (n == undefined || n <= 0 || this.size >= n) return;

    const need = n - this.size;
    for (let i = 0; i < need; i++) {
      this._container.push(new this.construct());
    }
  }

  /**
   * 获取对象实例
   * @param args 初始化参数
   * @returns 对象实例
   */
  acquire(...args: any[]): T {
    const instance = this._container.shift() ?? new this.construct();
    instance.token = this.token;
    instance.initialize(...args);

    if (this.size == 0 && this.options.expands > 0) {
      setTimeout(() => this.fill(this.options.expands), 0);
    }

    return instance;
  }

  /**
   * 回收对象实例
   * @param instance 要回收的对象实例
   */
  recycle(instance: T): void {
    if (instance && instance.recycle()) {
      const capacity = this.capacity;
      const size = this.size;
      if (capacity <= 0 || size < capacity) {
        // 延迟回收，防止同一时间被回收又被取出使用可能引起不必要的麻烦
        setTimeout(() => this._container.push(instance), 0);
      }
    }
  }

  /**
   * 清理过期未使用的对象
   */
  clearUnused(): void {
    const expires = this.expires;
    if (expires <= 0) return;

    const expands = this.options.expands;
    if (this.size <= expands) return;

    for (let i = this.size - 1 - expands; i >= 0; i--) {
      this._container.splice(i, 1);
    }
  }

  /**
   * 清空池子中的所有对象
   */
  clear(): void {
    for (let i = this.size - 1; i >= 0; i--) {
      this._container[i].recycle();
      this._container.splice(i, 1);
    }
  }
}

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
  poolOf<T extends IObjectEntry>(cls: Constructor<T> | string): ObjectPool<T>;

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

/**
 * 对象池容器插件
 */
export class ObjectPoolPlugin extends Plugin implements IObjectPoolPlugin {
  public static readonly Token = PRESET_TOKEN.OBJECT_POOL;

  /** 池子容器 */
  private _container: Map<string, Pair<ObjectPool<IObjectEntry>, Constructor<IObjectEntry>>> = new Map();

  /**
   * 注册对象池
   * @param cls 对象构造函数
   * @param options 池子配置
   */
  register(cls: Constructor<IObjectEntry>, options: IRecyclableOptions): void {
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
  poolOf<T extends IObjectEntry>(cls: Constructor<T> | string): ObjectPool<T> {
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

    return this._container.get(token)![0] as ObjectPool<T>;
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
