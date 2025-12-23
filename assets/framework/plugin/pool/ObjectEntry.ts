import { time } from 'fast/util';

import { IObjectEntry } from './IObjectEntry';

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
