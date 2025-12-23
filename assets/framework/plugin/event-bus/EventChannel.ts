import { list } from 'fast/util';

import { IEventChannel } from './IEventChannel';
import { IEventListener } from './IEventListener';

/**
 * 事件渠道
 * - 用于发布和订阅事件
 * - 每个渠道可以有多个事件监听器
 */
export class EventChannel implements IEventChannel {
  /** 事件监听器容器 */
  private _container: Map<string, IEventListener[]> = new Map();

  /**
   * 构造函数
   * @param _channel 渠道名称
   */
  constructor(private readonly _channel: string) {}

  get channel(): string {
    return this._channel;
  }

  emit(event: string, ...data: any[]): void {
    if (this._container.has(event)) {
      const listeners = this._container.get(event)!;
      list.each(
        listeners,
        (v, i) => {
          v.handle.apply(v.context, ...data);
          if (v.once) {
            listeners.splice(i!, 1);
          }
        },
        true
      );
    }
  }

  has(event: string): boolean {
    return this._container.has(event) && this._container.get(event)!.length > 0;
  }

  on(
    listener: IEventListener | string,
    handle?: (...args: any[]) => void | Promise<void>,
    context?: any,
    once?: boolean
  ): void {
    if (typeof listener === 'string') {
      if (!handle) {
        return;
      }
      once ??= false;
      listener = {
        event: listener,
        handle,
        once,
        context,
      };
    }
    if (!this._container.has(listener.event)) {
      this._container.set(listener.event, [listener]);
    } else {
      this._container.get(listener.event)!.push(listener);
    }
  }

  off(event?: string, ctx?: any): void {
    if (event !== undefined && ctx !== undefined) {
      // 同时指定事件名称和上下文时，取消特定监听器的订阅
      if (this._container.has(event)) {
        const listeners = this._container.get(event)!;
        for (let i = listeners.length - 1; i >= 0; i--) {
          if (listeners[i].context === ctx) {
            listeners.splice(i, 1);
          }
        }
        if (listeners.length === 0) {
          this._container.delete(event);
        }
      }
    } else if (event != undefined && ctx == undefined) {
      // 仅指定事件名称时，取消所有该事件的订阅
      if (this._container.has(event)) {
        this._container.delete(event);
      }
    } else if (event == undefined && ctx != undefined) {
      // 仅指定上下文时，取消所有该上下文的订阅
      for (let [evt, listeners] of this._container) {
        for (let i = listeners.length - 1; i >= 0; i--) {
          if (listeners[i].context === ctx) {
            listeners.splice(i, 1);
          }
        }
        if (listeners.length === 0) {
          this._container.delete(evt);
        }
      }
    } else {
      // 未指定事件名称和上下文时，取消所有订阅
      this._container.clear();
    }
  }

  clear(): void {
    this._container.clear();
  }
}
