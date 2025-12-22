import { IRecyclableObject } from './IRecycleable';

/**
 * 对象池条目接口
 */
export interface IObjectEntry extends IRecyclableObject {
  /** 是否已初始化 */
  get initialized(): boolean;
  /** 是否已销毁 */
  get destroyed(): boolean;
  /**
   * 自动初始化
   * @warn 请勿手动调用
   * @param args 入参
   */
  initialize(...args: any[]): void;
  /**
   * 自动回收
   * @warn 请勿手动调用
   * @returns 回收结果
   */
  recycle(): boolean;
  /** 重置 */
  reset(): void;
  /**
   * 初始化回调
   *
   * 可以在此处执行自定义操作
   * @param args 入参
   */
  onInitialize(...args: any[]): void;
  /**
   * 回收回调
   *
   * 可以在此处执行自定义操作
   */
  onRecycled(): void;
}
