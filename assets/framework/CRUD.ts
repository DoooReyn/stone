import { Constructor } from 'cc';

import { FrameworkError } from './FrameworkError';

export class CRUD<T> {
  protected container: Map<string, T> = new Map();

  public constructor(public readonly cls: Constructor<T>) {}

  /**
   * CREATE
   * @param token 标识
   * @param args 入参
   * @returns
   */
  public acquire(token: string, ...args: ConstructorParameters<Constructor<T>>): T {
    if (this.container.has(token)) {
      throw new FrameworkError(`Token ${token} has been created already.`);
    }
    const instance = new this.cls(...args);
    this.container.set(token, instance);
    return instance;
  }

  /**
   * DELETE
   * @param token 标识
   */
  public unset(token: string) {
    this.container.delete(token);
  }

  /**
   * UPDATE
   * @param token 标识
   * @param item 对象
   */
  public set(token: string, item: T) {
    this.container.set(token, item);
  }

  /**
   * READ
   * @param token 标识
   * @returns
   */
  public has(token: string): boolean {
    return this.container.has(token);
  }
}
