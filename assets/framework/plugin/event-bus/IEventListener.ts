/**
 * 事件监听器接口
 * @description 事件监听器是用于处理事件的回调函数。
 * 它包含事件名称、事件上下文和事件处理函数。
 */
export interface IEventListener {
  /** 事件名称 */
  readonly event: string;
  /** 事件上下文 */
  readonly context?: any;
  /** 是否只执行一次 */
  readonly once?: boolean;
  /**
   * 事件处理函数
   * @param args 输入参数
   */
  handle(...args: any[]): void | Promise<void>;
}
