import { IPlugin } from '../../foundation';

/**
 * 全局变量管理插件接口
 */
export interface IGlobal extends IPlugin {
  get<T>(varname: string): T | undefined;
  set<T>(varname: string, value: T): void;
  has(varname: string): boolean;
  unset(varname: string): void;
}
