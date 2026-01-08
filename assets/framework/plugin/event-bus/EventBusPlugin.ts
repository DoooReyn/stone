import { PRESET_EVENT_CHANNEL } from 'fast/config/Event';
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

  public get shared() {
    return this.acquire(PRESET_EVENT_CHANNEL.SHARED);
  }

  public get app() {
    return this.acquire(PRESET_EVENT_CHANNEL.APP);
  }

  public get gui() {
    return this.acquire(PRESET_EVENT_CHANNEL.GUI);
  }

  public get red() {
    return this.acquire(PRESET_EVENT_CHANNEL.RED);
  }

  public acquire(channel: string): IEventChannel {
    if (!this._container.has(channel)) {
      this._container.set(channel, new EventChannel(channel));
    }

    return this._container.get(channel)!;
  }

  public has(channel: string): boolean {
    return this._container.has(channel);
  }

  public remove(channel: string): void {
    this._container.delete(channel);
  }

  public clear(): void {
    this._container.clear();
  }
}
