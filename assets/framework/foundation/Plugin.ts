import { PRESET_TOKEN } from 'fast/config/Token';
import { might } from 'fast/util';

import { FastError } from './Error';
import { logcat, Logger } from './Logcat';

/** 插件状态 */
export enum PluginState {
  /** 未初始化 */
  Uninitialized = 0,
  /** 初始化中 */
  Initializing,
  /** 初始化完成 */
  Initialized,
  /** 正在销毁 */
  Disposing,
  /** 已销毁 */
  Disposed,
}

/**
 * 插件基类
 */
export class Plugin {
  /**
   * 标识
   * @static
   * @notes 子类必须重写
   */
  public static readonly Token: string;

  /**
   * 获取插件句柄
   * @see assets/framework/Fast
   */
  public static Of: <T extends IPlugin>(token: string) => T | undefined;

  /** 依赖项 */
  private _dependencies: Record<string, IPlugin> = {};

  /**
   * 依赖项
   * @notes 子类用到时必须重写
   */
  protected readonly $dependencies: string[] = [];

  /**
   * 获取依赖插件
   * @param token 插件标识
   * @returns
   */
  public of<T extends IPlugin>(token: string): T {
    return this._dependencies[token] as unknown as T;
  }

  /** 标识 */
  public get token() {
    return (this.constructor as typeof Plugin).Token;
  }

  /** 日志 */
  public get logger() {
    return logcat.acquire(this.token);
  }

  /** 状态 */
  private _state: PluginState = PluginState.Uninitialized;

  /** 状态 */
  public get state() {
    return this._state;
  }

  /**
   * 初始化
   * @async
   */
  public async initialize() {
    if (this._state === PluginState.Uninitialized) {
      this._state = PluginState.Initializing;

      this.$dependencies.forEach((token) => {
        const dep = Plugin.Of(token);
        if (!dep) throw new FastError(PRESET_TOKEN.FAST, `插件 ⁅${token}⁆ 不存在或未注册`);
        this._dependencies[token] = dep;
      });

      const err = (await might.runAsync(this.onInitialize()))[1];
      if (err) this.logger.e(`插件 ⁅${this.token}⁆ 初始化失败`, err);
      else this._state = PluginState.Initialized;
    }
  }

  /**
   * 销毁
   * @async
   */
  public async dispose() {
    if (this._state === PluginState.Initialized || this._state === PluginState.Uninitialized) {
      this._state = PluginState.Disposing;
      const err = (await might.runAsync(this.onDispose()))[1];
      if (err) this.logger.e(`插件⁅${this.token}⁆销毁失败`, err);
      else this._state = PluginState.Disposed;
    }
  }

  /**
   * 初始化逻辑
   * @protected
   * @async
   * @notes 子类可重写此方法以实现自定义初始化逻辑
   */
  protected async onInitialize() {}

  /**
   * 销毁逻辑
   * @protected
   * @async
   * @notes 子类可重写此方法以实现自定义销毁逻辑
   */
  protected async onDispose() {}
}

/**
 * 插件接口
 */
export interface IPlugin {
  /** 标识 */
  get token(): string;
  /** 状态 */
  get state(): PluginState;
  /** 日志 */
  get logger(): Logger;
  /** 初始化 */
  initialize(): Promise<void>;
  /** 销毁 */
  dispose(): Promise<void>;
}
