export interface ISystemInfo {
  readonly name: string;
  readonly version?: string;
  readonly author?: string;
}

export enum SystemState {
  Uninitialized,
  Initializing,
  Initialized,
  Disposing,
  Disposed,
}

export class System {
  public static readonly Infomation: ISystemInfo;
  private _state: SystemState = SystemState.Uninitialized;
  public get state() {
    return this._state;
  }

  public async initialize() {
    if (this._state === SystemState.Uninitialized) {
      this._state = SystemState.Initializing;
      await this.doInitialize();
      this._state = SystemState.Initialized;
    }
  }

  public async dispose() {
    if (this._state === SystemState.Initialized || this._state === SystemState.Uninitialized) {
      this._state = SystemState.Disposing;
      await this.doDispose();
      this._state = SystemState.Disposed;
    }
  }

  protected async doInitialize() {}

  protected async doDispose() {}
}

export interface ISystem {
  get state(): SystemState;
  initialize(): Promise<void>;
  dispose(): Promise<void>;
}
