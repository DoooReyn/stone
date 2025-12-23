import { PRESET_TIMER } from 'fast/config/Timer';
import { PRESET_TOKEN } from 'fast/config/Token';
import { Plugin } from 'fast/foundation/Plugin';

import { ITimerPlugin } from './ITimerPlugin';
import { Tick } from './Tick';

/**
 * 定时器容器
 * @description 提供了时器的安装、卸载和更新功能
 */
export class TimerPlugin extends Plugin implements ITimerPlugin {
  public static readonly Token: string = PRESET_TOKEN.TIMER;

  /** 定时器容器 */
  private readonly _container: Map<string, Tick> = new Map();

  public get shared() {
    return this.acquire(PRESET_TIMER.SHARED);
  }

  public get system() {
    return this.acquire(PRESET_TIMER.SYSTEM);
  }

  public get gc() {
    return this.acquire(PRESET_TIMER.GC);
  }

  public acquire(key: string) {
    let tick = this._container.get(key);

    if (!tick) {
      tick = new Tick();
      this._container.set(key, tick);
    }

    return tick;
  }

  public pause() {
    this._container.forEach((tick) => tick.pause());
  }

  public resume() {
    this._container.forEach((tick) => tick.run());
  }

  public stop() {
    this.pause();
    this._container.forEach((tick) => tick.stop());
    this._container.clear();
  }

  public update(dt: number) {
    this._container.forEach((tick) => tick.update(dt));
  }
}
