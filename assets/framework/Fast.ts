import { Constructor } from 'cc';

import { FastError } from './foundation/Error';
import { logcat } from './foundation/Logcat';
import { IPlugin, Plugin } from './foundation/Plugin';

/**
 * Fast 框架
 */
class Fast {
  /** 框架信息 */
  public readonly infomation = {
    name: 'Fast',
    version: '1.0.0',
    author: 'github.com/DoooReyn',
  } as const;

  /** 插件容器 */
  private readonly _container: Map<string, IPlugin> = new Map();

  /** 日志 */
  public get logger() {
    return logcat.acquire(this.infomation.name);
  }

  /**
   * 注册插件
   * @param plugin 插件类
   */
  public register(plugin: typeof Plugin) {
    if (this._container.has(plugin.Token)) {
      throw new FastError(this.infomation.name, `插件⁅${plugin.Token}⁆重复注册`);
    }

    this._container.set(plugin.Token, new plugin());
    this.logger.d(`插件⁅${plugin.Token}⁆已注册`);
  }

  /**
   * 注销插件
   * @param name 插件标识
   */
  public unregister(name: string) {
    if (this._container.has(name)) {
      this._container.delete(name);
      this._container.get(name)!.dispose();
      this.logger.d(`插件⁅${name}⁆已注销`);
    }
  }

  /**
   * 获取插件实例
   * @param alias 插件标识或插件类
   * @returns 插件实例
   */
  public acquire<T extends IPlugin>(alias: string | Constructor<T>): T {
    const token = typeof alias !== 'string' ? (alias as unknown as typeof Plugin).Token : alias;

    if (!this._container.has(token)) {
      throw new FastError(this.infomation.name, `插件⁅${token}⁆未注册`);
    }

    return this._container.get(token) as T;
  }
}

/**
 * Fast 唯一单例
 * @exports
 */
export const fast = new Fast();
