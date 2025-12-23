import { TOKENS } from '../../config';
import { Plugin } from '../../foundation';
import { dict } from '../../util';

/**
 * 全局变量管理插件
 */
export class GlobalPlugin extends Plugin {
  public static readonly Token = TOKENS.GLOBAL;

  /** 全局对象 */
  // @ts-ignore
  private _env = globalThis ?? window ?? self ?? frames ?? GameGlobal ?? {};

  /**
   * 获取
   * @param varname 变量名
   * @returns 值
   */
  get<T>(varname: string): T | undefined {
    return dict.get(this._env, varname) as T | undefined;
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
    dict.set(this._env, varname, value);
  }

  /**
   * 查询
   * @param varname 变量名
   * @returns 是否存在
   */
  has(varname: string): boolean {
    return dict.own(this._env, varname);
  }

  /**
   * 删除
   * @param varname 变量名
   */
  unset(varname: string): void {
    if (this.has(varname)) {
      dict.unset(this._env, varname);
      this.logger.d(`全局变量⁅${varname}⁆已删除`);
    }
  }
}
