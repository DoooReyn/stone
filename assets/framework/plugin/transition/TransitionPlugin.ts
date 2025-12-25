import { tween, Node, Tween } from 'cc';
import { PRESET_TOKEN } from 'fast/config/Token';
import { Plugin } from 'fast/foundation/Plugin';
import { might } from 'fast/util';

import { ITransitionArgs, ITransitionEntry, ITransitionPlugin } from './ITransitionPlugin';
import {
  BlurIn,
  BlurOut,
  DrawerIn,
  DrawerOut,
  Earthquake,
  Explosion,
  Jelly,
  PopupIn,
  PopupOut,
  ScrollNumber,
  Shake,
  Vibration,
  Wave
} from './Transitions';

/**
 * 节点过渡效果库插件
 */
export class TransitionPlugin extends Plugin implements ITransitionPlugin {
  public static readonly Token: string = PRESET_TOKEN.TRANSITION;
  /** 已注册的缓动库容器：lib -> entry */
  private _container: Map<string, ITransitionEntry> = new Map();
  /** 运行时缓动表：node.uuid -> Map<lib, [Tween<Node>, ITransitionArgs]> */
  private _runtime: Map<string, Map<string, [Tween<Node>, ITransitionArgs]>> = new Map();

  async onInitialize() {
    this.register(BlurIn);
    this.register(BlurOut);
    this.register(DrawerIn);
    this.register(DrawerOut);
    this.register(PopupIn);
    this.register(PopupOut);
    this.register(ScrollNumber);
    this.register(Shake);
    this.register(Wave);
    this.register(Vibration);
    this.register(Explosion);
    this.register(Earthquake);
    this.register(Jelly);
  }

  destroy() {
    this.stopAll();
    this._runtime.clear();
  }

  has(lib: string): boolean {
    return this._container.has(lib);
  }

  register(entry: ITransitionEntry): void {
    if (this._container.has(entry.lib)) {
      this.logger.w(`过渡效果 ⁅${entry.lib}⁆ 已替换`);
    } else {
      this.logger.i(`过渡效果 ⁅${entry.lib}⁆ 已注册`);
    }
    this._container.set(entry.lib, entry);
  }

  unregister(entry: ITransitionEntry | string): void {
    if (typeof entry === 'string') {
      this._container.delete(entry);
    } else {
      this._container.delete(entry.lib);
    }
  }

  clear(): void {
    this._container.clear();
  }

  isPlaying(node: Node, lib: string): boolean {
    if (this._runtime.has(node.uuid)) {
      const entries = this._runtime.get(node.uuid)!;
      if (entries.has(lib)) {
        return !!entries.get(lib)![0]?.running;
      }
    }
    return false;
  }

  async play(node: Node, lib: string, args?: ITransitionArgs): Promise<void> {
    await might.logAsync(this.internalPlay(node, lib, args), this.logger);
  }

  pause(node: Node, lib: string): void {
    if (this._runtime.has(node.uuid)) {
      const entries = this._runtime.get(node.uuid)!;
      if (entries.has(lib)) {
        const [twn, a] = entries.get(lib)!;
        twn?.pause();
        might.logSync(() => a.onPause?.call(a.context, node), this.logger);
      }
    }
  }

  resume(node: Node, lib: string): void {
    if (this._runtime.has(node.uuid)) {
      const entries = this._runtime.get(node.uuid)!;
      if (entries.has(lib)) {
        const [twn, a] = entries.get(lib)!;
        twn?.resume();
        might.logSync(() => a.onResume?.call(a.context, node), this.logger);
      }
    }
  }

  stop(node: Node, lib: string): void {
    if (this._runtime.has(node.uuid)) {
      const entries = this._runtime.get(node.uuid)!;
      if (entries.has(lib)) {
        const [twn, a] = entries.get(lib)!;
        twn?.stop();
        entries.delete(lib);
        might.logSync(() => a.onStop?.call(a.context, node), this.logger);
      }
    }
  }

  pauseAll(node?: Node): void {
    const logger = this.logger;
    if (node) {
      if (this._runtime.has(node.uuid)) {
        const entries = this._runtime.get(node.uuid)!;
        entries.forEach((entry, lib) => {
          const [twn, args] = entry;
          twn.pause();
          might.logSync(() => args.onPause?.call(args.context, node), this.logger);
        });
      }
    } else {
      this._runtime.forEach((entries) => {
        entries.forEach((entry, lib) => {
          const [twn, args] = entry;
          twn.pause();
          might.logSync(() => args.onPause?.call(args.context, node), this.logger);
        });
      });
    }
  }

  resumeAll(node?: Node): void {
    const logger = this.logger;
    if (node) {
      if (this._runtime.has(node.uuid)) {
        const entries = this._runtime.get(node.uuid)!;
        entries.forEach((entry, lib) => {
          const [twn, args] = entry;
          twn.resume();
          might.logSync(() => args.onResume?.call(args.context, node), this.logger);
        });
      }
    } else {
      this._runtime.forEach((entries) => {
        entries.forEach((entry, lib) => {
          const [twn, args] = entry;
          twn.resume();
          might.logSync(() => args.onResume?.call(args.context, node), this.logger);
        });
      });
    }
  }

  stopAll(node?: Node): void {
    const logger = this.logger;
    if (node) {
      if (this._runtime.has(node.uuid)) {
        const entries = this._runtime.get(node.uuid)!;
        entries.forEach((entry, lib) => {
          const [twn, args] = entry;
          twn.stop();
          entries.delete(lib);
          might.logSync(() => args.onStop?.call(args.context, node), this.logger);
        });
        entries.clear();
      }
    } else {
      this._runtime.forEach((entries) => {
        entries.forEach((entry, lib) => {
          const [twn, args] = entry;
          twn.stop();
          entries.delete(lib);
          might.logSync(() => args.onStop?.call(args.context, node), this.logger);
        });
        entries.clear();
      });
      this._runtime.clear();
    }
  }

  /**
   * 内部播放流程
   * @param node 目标节点
   * @param lib 缓动库名
   * @param args 播放参数（与注册默认参数浅合并后生效）
   * @returns 异步完成 Promise
   */
  private async internalPlay(node: Node, lib: string, args?: ITransitionArgs) {
    return new Promise<void>((resolve) => {
      const entry = this._container.get(lib);
      if (!entry) {
        this.logger.e(`过渡效果 ⁅${lib}⁆ 播放失败，目标未注册`);
        return resolve();
      }

      if (args) {
        args = { ...entry.args, ...args };
      } else {
        args = { ...entry.args };
      }
      args.existencePolicy ??= 'override';

      if (this._runtime.has(node.uuid)) {
        const entries = this._runtime.get(node.uuid)!;
        if (entries.has(lib)) {
          if (args.existencePolicy === 'skip') {
            this.logger.i(`过渡效果 ⁅${lib}⁆ 正在播放，已跳过`);
            return resolve();
          } else {
            this.logger.i(`过渡效果 ⁅${lib}⁆ 正在播放，将停止并替换`);
            entries.get(lib)![0]?.stop();
            entries.delete(lib);
            might.logSync(() => args!.onStop?.call(args!.context, node), this.logger);
          }
        }
      } else {
        this._runtime.set(node.uuid, new Map());
      }

      const t1 = tween(node).call(() => {
        might.logSync(() => args!.onStart?.call(args!.context, node), this.logger);
        // this.logger.i(`缓动动画: ${lib} 第一阶段播放结束`);
      });
      const [t2, createErr] = might.runSync(() => entry.create(node, args!));
      if (createErr || !t2) {
        this.logger.e(`过渡效果 ⁅${lib}⁆ 构建失败`, createErr);
        return resolve();
      }
      // t2.call(() => {
      //   this.logger.i(`缓动动画: ${lib} 第二阶段播放结束`);
      // });
      const t3 = tween(node).call(() => {
        const map = this._runtime.get(node.uuid);
        map?.delete(lib);
        might.runSync(() => args!.onEnd?.call(args!.context, node), this.logger);
        // this.logger.i(`缓动动画: ${lib} 第三阶段播放结束`);
        resolve();
      });
      const twn = tween().sequence(t1, t2, t3).target(node).bindNodeState(true);
      this._runtime.get(node.uuid)!.set(lib, [twn, args]);
      twn.start();
    });
  }
}
