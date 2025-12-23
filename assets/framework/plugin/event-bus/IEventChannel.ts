import { IEventListener } from './IEventListener';

/**
 * 事件渠道接口
 * @description 事件渠道是事件总线中的一个通道，用于发布和订阅事件。
 * 每个事件渠道都有一个唯一的名称，用于标识该渠道。
 */
export interface IEventChannel {
  /** 渠道名称 */
  readonly channel: string;
  /**
   * 发布事件
   * @param event 事件名称
   * @param data 事件数据
   */
  emit(event: string, ...data: any[]): void;
  /**
   * 查询事件是否已订阅
   * @param event 事件名称
   * @returns 是否已订阅
   */
  has(event: string): boolean;
  /**
   * 订阅事件
   * @param listener 事件监听器
   */
  on(listener: IEventListener): void;
  /**
   * 订阅事件
   * @param listener 事件名称
   * @param handle 事件处理函数
   * @param context 事件上下文 [可选]
   * @param once 是否只执行一次 [可选]
   */
  on(listener: string, handle: (...args: any[]) => void | Promise<void>, context?: any, once?: boolean): void;
  /**
   * 取消订阅事件
   * - 同时指定事件名称和上下文时，取消该监听器的订阅
   * - 仅指定事件名称时，取消所有该事件的订阅
   * - 仅指定上下文时，取消所有该上下文的订阅
   * - 未指定事件名称和上下文时，取消所有订阅
   * @param event 事件名称 [可选]
   * @param ctx 事件上下文 [可选]
   */
  off(event?: string, ctx?: any): void;
  /** 取消所有订阅事件 */
  clear(): void;
}
