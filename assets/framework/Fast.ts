import { Constructor } from 'cc';

import { TOKENS } from './config/Token';
import { FastError } from './Error';
import { logcat } from './Logcat';
import { IPlugin, Plugin } from './Plugin';

/**
 * Fast 框架
 */
export class Fast {
  /** 框架信息 */
  public static readonly Infomation = {
    name: 'Fast',
    version: '1.0.0',
    author: 'github.com/DoooReyn',
  } as const;

  /** 插件容器 */
  private static readonly _Container: Map<string, IPlugin> = new Map();

  /** 日志 */
  public static get logger() {
    return logcat.acquire(this.Infomation.name);
  }

  /**
   * 注册插件
   * @param plugin 插件类
   */
  public static Register(plugin: typeof Plugin) {
    if (this._Container.has(plugin.Token)) {
      throw new FastError(TOKENS.FAST, `Plugin 『${plugin.Token}』 has been registered already.`);
    }

    this.logger.d(`Register plugin: 『${plugin.Token}』`);
    this._Container.set(plugin.Token, new plugin());
  }

  /**
   * 注销插件
   * @param name 插件标识
   */
  public static Unregister(name: string) {
    if (this._Container.has(name)) {
      this._Container.delete(name);
      this.logger.d(`Plugin 『${name}』 has been unregistered`);
      this._Container.get(name)!.dispose();
    }
  }

  /**
   * 获取插件实例
   * @param alias 插件标识或插件类
   * @returns 插件实例
   */
  public static Acquire<T extends IPlugin>(alias: string | Constructor<T>): T {
    const token = typeof alias !== 'string' ? (alias as unknown as typeof Plugin).Token : alias;

    if (!this._Container.has(token)) {
      throw new FastError(TOKENS.FAST, `Plugin 『${token}』 has not been registered yet.`);
    }

    return this._Container.get(token) as T;
  }
}
