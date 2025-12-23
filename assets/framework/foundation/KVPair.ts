import { Constructor } from 'cc';

/**
 * 以键值对存储的对象容器
 */
export class KVPair<T> {
  /** 容器 */
  protected container: Map<string, T> = new Map();

  /**
   * 构造函数
   * @param cls 对象构造
   */
  public constructor(public readonly cls: Constructor<T>) {}

  /**
   * 获取
   * @param token 标识
   * @param args 入参
   * @returns
   */
  public acquire(token: string, ...args: ConstructorParameters<Constructor<T>>): T {
    if (this.container.has(token)) {
      return this.container.get(token)!;
    }

    const instance = new this.cls(token, ...args);
    this.container.set(token, instance);
    return instance;
  }

  /**
   * 删除
   * @param token 标识
   */
  public unset(token: string) {
    this.container.delete(token);
  }

  /**
   * 更新
   * @param token 标识
   * @param item 对象
   */
  public set(token: string, item: T) {
    this.container.set(token, item);
  }

  /**
   * 查询
   * @param token 标识
   * @returns
   */
  public has(token: string): boolean {
    return this.container.has(token);
  }
}
