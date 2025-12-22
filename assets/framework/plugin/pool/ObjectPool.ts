import { Constructor } from 'cc';

import { FastError } from '../../Error';
import { Plugin } from '../../Plugin';
import { Pair } from '../../Types';
import { time } from '../../util';
import { IObjectEntry } from './IObjectEntry';
import { IRecyclableOptions } from './IRecycleable';

/**
 * 对象条目
 */
export abstract class ObjectEntry implements IObjectEntry {
  createdAt: number = 0;
  recycledAt: number = 0;
  token: string;

  get initialized(): boolean {
    return this.createdAt > 0;
  }

  get destroyed(): boolean {
    return this.recycledAt > 0;
  }

  initialize(...args: any[]): void {
    if (!this.initialized) {
      this.reset();
      this.createdAt = time.now();
      this.recycledAt = 0;
      this.onInitialize(...args);
    }
  }

  recycle(): boolean {
    if (!this.destroyed) {
      this.recycledAt = time.now();
      this.createdAt = 0;
      this.onRecycled();
      return true;
    }
    return false;
  }

  reset(): void {}

  abstract onInitialize(...args: any[]): void;

  abstract onRecycled(): void;
}

/**
 * 对象池
 */
export class ObjectPool<T extends ObjectEntry> {
  /** 条目列表 */
  private readonly _items: T[];

  /**
   * 构造函数
   * @param construct 对象池条目构造
   * @param options 对象池条目配置
   */
  constructor(public readonly construct: Constructor<T>, public readonly options: IRecyclableOptions) {
    this._items = [];
    this.fill(this.options.expands);
  }

  get token() {
    return this.options.token;
  }

  get capacity() {
    return this.options.capacity;
  }

  get expires() {
    return this.options.expires;
  }

  get size(): number {
    return this._items.length;
  }

  fill(n: number): void {
    if (n == undefined || n <= 0 || this.size >= n) return;

    const need = n - this.size;
    for (let i = 0; i < need; i++) {
      this._items.push(new this.construct());
    }
  }

  acquire(...args: any[]): T {
    const instance = this._items.shift() ?? new this.construct();
    instance.token = this.token;
    instance.initialize(...args);

    if (this.size == 0 && this.options.expands > 0) {
      setTimeout(() => this.fill(this.options.expands), 0);
    }

    return instance;
  }

  recycle(instance: T): void {
    if (instance && instance.recycle()) {
      const capacity = this.capacity;
      const size = this.size;
      if (capacity <= 0 || size < capacity) {
        // 延迟回收，防止同一时间被回收又被取出使用可能引起不必要的麻烦
        setTimeout(() => this._items.push(instance), 0);
      }
    }
  }

  clearUnused(): void {
    const expires = this.expires;
    if (expires <= 0) return;

    const expands = this.options.expands;
    if (this.size <= expands) return;

    for (let i = this.size - 1 - expands; i >= 0; i--) {
      this._items.splice(i, 1);
    }
  }

  clear(): void {
    for (let i = this.size - 1; i >= 0; i--) {
      this._items[i].recycle();
      this._items.splice(i, 1);
    }
  }
}

/**
 * 对象池容器插件
 */
export class ObjectPoolPlugin extends Plugin {
  public static readonly Token = 'ObjectPool';

  /** 池子容器 */
  private _container: Map<string, Pair<ObjectPool<IObjectEntry>, Constructor<IObjectEntry>>> = new Map();

  register(cls: Constructor<IObjectEntry>, options: IRecyclableOptions): void {
    const token = options.token;

    if (this._container.has(token)) {
      throw new FastError(this.token, `对象池⁅${token}⁆重复注册`);
    }

    this._container.set(token, [new ObjectPool(cls, options), cls]);
  }

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

  acquire<T extends IObjectEntry>(cls: Constructor<T>, ...args: any[]): T | undefined {
    const inst = this.poolOf(cls);

    if (inst === undefined) {
      throw new FastError(this.token, `对象池⁅${cls.name}⁆未注册`);
    }

    return inst.acquire(...args) as T;
  }

  recycle<T extends IObjectEntry>(instance: T): void {
    if (instance && instance.token !== undefined && instance.recycle !== undefined) {
      if (!this._container.has(instance.token)) {
        throw new FastError(this.token, `对象池⁅${instance.token}⁆未注册`);
      }

      this._container.get(instance.token)![0].recycle(instance);
      this.logger.d(`对象池⁅${instance.token}⁆条目已回收`);
    }
  }

  clearUnused(): void {
    this._container.forEach((v) => v[0].clearUnused());
  }

  clear(): void {
    this._container.forEach((p) => p[0].clear());
  }
}
