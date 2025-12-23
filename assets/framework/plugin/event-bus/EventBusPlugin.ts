import { PRESET_EVENT } from 'fast/config/Event';
import { PRESET_TOKEN } from 'fast/config/Token';
import { Plugin } from 'fast/foundation/Plugin';

import { EventChannel } from './EventChannel';
import { IEventBusPlugin } from './IEventBusPlugin';
import { IEventChannel } from './IEventChannel';

/**
 * 事件总线
 * - 用于管理事件渠道，实现事件的发布和订阅。
 */
export class EventBusPlugin extends Plugin implements IEventBusPlugin {
  public static readonly Token: string = PRESET_TOKEN.EVENT_BUS;

  /** 事件渠道容器 */
  private _container: Map<string, IEventChannel> = new Map();

  get shared() {
    return this.acquire(PRESET_EVENT.SHARED);
  }

  get app() {
    return this.acquire(PRESET_EVENT.APP);
  }

  get gui() {
    return this.acquire(PRESET_EVENT.GUI);
  }

  get red() {
    return this.acquire(PRESET_EVENT.RED);
  }

  acquire(channel: string): IEventChannel {
    if (!this._container.has(channel)) {
      this._container.set(channel, new EventChannel(channel));
    }

    return this._container.get(channel)!;
  }

  has(channel: string): boolean {
    return this._container.has(channel);
  }

  remove(channel: string): void {
    this._container.delete(channel);
  }

  clear(): void {
    this._container.clear();
  }
}
