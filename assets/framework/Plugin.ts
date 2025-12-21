import { logcat, Logger } from './Logcat';
import { runAsync } from './util/Might';

/**
 * 插件信息
 */
export interface IPluginInfo {
  /** 标识 */
  readonly token: string;
  /** 版本 */
  readonly version?: string;
  /** 作者 */
  readonly author?: string;
}

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
   * 信息
   * @requires 子类必须重写
   * @static
   */
  public static readonly Infomation: IPluginInfo;

  /** 标识 */
  public get token() {
    return (this.constructor as typeof Plugin).Infomation.token;
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
      const err = (await runAsync(this.doInitialize()))[1];
      if (err) this.logger.e(`Plugin ${this.token} initialize failed.`, err);
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
      const err = (await runAsync(this.doDispose()))[1];
      if (err) this.logger.e(`Plugin ${this.token} dispose failed.`, err);
      else this._state = PluginState.Disposed;
    }
  }

  /**
   * 初始化逻辑
   * @protected
   * @async
   * @notes 子类可重写此方法以实现自定义初始化逻辑
   */
  protected async doInitialize() {}

  /**
   * 销毁逻辑
   * @protected
   * @async
   * @notes 子类可重写此方法以实现自定义销毁逻辑
   */
  protected async doDispose() {}
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
