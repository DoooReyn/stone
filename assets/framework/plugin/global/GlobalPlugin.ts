import { PRESET_TOKEN } from 'fast/config/Token';
import { Plugin } from 'fast/foundation/Plugin';
import { Global } from 'fast/Types';

/**
 * 全局变量管理插件
 */
export class GlobalPlugin extends Plugin {
  public static readonly Token = PRESET_TOKEN.GLOBAL;

  /** 全局对象 */
  // @ts-ignore
  private _env: Global = globalThis ?? window ?? self ?? frames ?? GameGlobal ?? {};

  /**
   * 获取
   * @param varname 变量名
   * @returns 值
   */
  get<T>(varname: string): T | undefined {
    return this._env[varname] as T | undefined;
  }

  /**
   * 查询
   * @param varname 变量名
   * @returns 是否存在
   */
  has(varname: string): boolean {
    return this._env[varname] !== undefined;
  }

  /**
   * 设置
   * @param varname 变量名
   * @param value 值
   */
  set<T>(varname: string, value: T): void {
    if (this.has(varname)) {
      this.logger.w(`全局变量⁅${varname}⁆已覆盖`);
    } else {
      this.logger.d(`全局变量⁅${varname}⁆已添加`);
    }
    this._env[varname] = value;
  }

  /**
   * 删除
   * @param varname 变量名
   */
  unset(varname: string): void {
    if (this.has(varname)) {
      delete this._env[varname];
      this.logger.d(`全局变量⁅${varname}⁆已删除`);
    }
  }
}
