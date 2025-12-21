import { Constructor } from 'cc';

import { FrameworkError } from './FrameworkError';
import { ISystem, System } from './System';

export class Framework {
  private static readonly _Container: Map<string, ISystem> = new Map();

  public static Register(cls: typeof System) {
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

  public static Acquire<T extends ISystem>(cname: string | Constructor<T>): T {
    const token = typeof cname !== 'string' ? (cname as unknown as typeof System).Infomation.name : cname;

    if (!this._Container.has(token)) {
      throw new FrameworkError(`System ${token} has not been registered yet.`);
    }

    return this._Container.get(token) as T;
  }
}
