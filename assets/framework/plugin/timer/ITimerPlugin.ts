import { IPlugin } from 'fast/foundation/Plugin';

import { Tick } from './Tick';

/**
 * 定时器服务接口
 * @description 定时器服务接口定义了定时器服务的行为
 */
export interface ITimerPlugin extends IPlugin {
  /**
   * 获取定时器
   * @param key 定时器标识
   */
  acquire(key: string): Tick;
  /**
   * 获取共享定时器
   * - 一般的，不应对此定时器调速
   */
  get shared(): Tick;
  /**
   * 获取系统定时器
   * - 一般的，不应对此定时器调速
   */
  get system(): Tick;
  /**
   * 获取回收定时器
   * - 一般的，不应对此定时器调速
   */
  get gc(): Tick;
  /**
   * 暂停所有定时器（不包括 Director）
   */
  pause(): void;
  /**
   * 恢复所有定时器（不包括 Director）
   */
  resume(): void;
  /**
   * 停止（清除）所有定时器（不包括 Director）
   */
  stop(): void;
  /**
   * 更新所有定时器（不包括 Director）
   * @param dt 时间片
   */
  update(dt: number): void;
}
