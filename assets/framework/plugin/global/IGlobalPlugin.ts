import { IPlugin } from 'fast/foundation/Plugin';

/**
 * 全局变量管理插件接口
 */
export interface IGlobalPlugin extends IPlugin {
  get<T>(varname: string): T | undefined;
  set<T>(varname: string, value: T): void;
  has(varname: string): boolean;
  unset(varname: string): void;
}
