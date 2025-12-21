import { Constructor } from 'cc';

import { FrameworkError } from './FrameworkError';
import { IPlugin, Plugin } from './Plugin';

export class Framework {
  private static readonly _Container: Map<string, IPlugin> = new Map();

  public static Register(cls: typeof Plugin) {
    if (this._Container.has(cls.Infomation.name)) {
      throw new FrameworkError(`System ${cls.Infomation.name} has been registered already.`);
    }

    this._Container.set(cls.Infomation.name, new cls());
  }

  public static Unregister(name: string) {
    if (this._Container.has(name)) {
      this._Container.delete(name);
      this._Container.get(name)!.dispose();
    }
  }

  public static Acquire<T extends IPlugin>(cname: string | Constructor<T>): T {
    const token = typeof cname !== 'string' ? (cname as unknown as typeof Plugin).Infomation.name : cname;

    if (!this._Container.has(token)) {
      throw new FrameworkError(`System ${token} has not been registered yet.`);
    }

    return this._Container.get(token) as T;
  }
}
