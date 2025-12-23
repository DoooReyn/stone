import { IPlugin } from 'fast/foundation/Plugin';

import { IEventChannel } from './IEventChannel';

/**
 * 事件总线接口
 * @description 事件总线是一种用于在应用程序中进行事件通信的机制。
 * 它允许不同的组件之间通过发布和订阅事件来进行通信，实现解耦和灵活的事件处理。
 */
export interface IEventBusPlugin extends IPlugin {
  /** 共享事件渠道 */
  get shared(): IEventChannel;
  /** GUI 事件频道 */
  get gui(): IEventChannel;
  /** 应用事件频道 */
  get app(): IEventChannel;
  /** 红点事件频道 */
  get red(): IEventChannel;
  /**
   * 获取事件渠道
   * @param channel 渠道名称
   * @returns 事件渠道
   */
  acquire(channel: string): IEventChannel;
  /**
   * 查询事件渠道是否已存在
   * @param channel 渠道名称
   * @returns 是否已存在
   */
  has(channel: string): boolean;
  /**
   * 移除事件渠道
   * @param channel 渠道名称
   */
  remove(channel: string): void;
  /** 删除所有事件渠道 */
  clear(): void;
}
