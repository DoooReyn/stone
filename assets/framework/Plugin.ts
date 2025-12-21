export interface IPluginInfo {
  readonly name: string;
  readonly version?: string;
  readonly author?: string;
}

export enum PluginState {
  Uninitialized,
  Initializing,
  Initialized,
  Disposing,
  Disposed,
}

export class Plugin {
  public static readonly Infomation: IPluginInfo;
  private _state: PluginState = PluginState.Uninitialized;
  public get state() {
    return this._state;
  }

  public async initialize() {
    if (this._state === PluginState.Uninitialized) {
      this._state = PluginState.Initializing;
      await this.doInitialize();
      this._state = PluginState.Initialized;
    }
  }

  public async dispose() {
    if (this._state === PluginState.Initialized || this._state === PluginState.Uninitialized) {
      this._state = PluginState.Disposing;
      await this.doDispose();
      this._state = PluginState.Disposed;
    }
  }

  protected async doInitialize() {}

  protected async doDispose() {}
}

export interface IPlugin {
  get state(): PluginState;
  initialize(): Promise<void>;
  dispose(): Promise<void>;
}
