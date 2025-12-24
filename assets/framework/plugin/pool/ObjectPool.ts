import { Constructor } from 'cc';

import { IObjectEntry } from './IObjectEntry';
import { IRecyclableOptions } from './IRecycleable';
import { ObjectEntry } from './ObjectEntry';

/**
 * 对象池接口
 */
export interface IObjectPool<T extends IObjectEntry> {
  /** 标识 */
  readonly token: string;
  /** 过期时间 */
  readonly expires: number;
  /** 扩容数量 */
  readonly expands: number;
  /** 容量限制 */
  readonly capacity: number;
  /** 当前数量 */
  readonly size: number;

  /**
   * 填充池子
   * @param n 目标数量
   */
  fill(n: number): void;

  /**
   * 获取对象实例
   * @param args 初始化参数
   * @returns 对象实例
   */
  acquire(...args: any[]): T;

  /**
   * 回收对象实例
   * @param instance 要回收的对象实例
   */
  recycle(instance: T): void;

  /**
   * 清理过期未使用的对象
   */
  clearUnused(): void;

  /**
   * 清空池子中的所有对象
   */
  clear(): void;
}

/**
 * 对象池
 */
export class ObjectPool<T extends ObjectEntry> implements IObjectPool<T> {
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
      const { capacity } = this;
      const { size } = this;
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
    const { expires } = this;
    if (expires <= 0) return;

    const { expands } = this.options;
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
