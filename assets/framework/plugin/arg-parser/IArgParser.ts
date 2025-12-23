import { IPlugin } from 'fast/foundation/Plugin';
import { Dict } from 'fast/Types';

import { IAppArgs } from './IAppArgs';

/**
 * 参数解析器插件接口
 */
export interface IArgParserPlugin extends IPlugin {
  /** 输出参数 */
  args: IAppArgs;
  /**
   * 解析参数
   * @param args 输入参数
   */
  parse(args: Dict): void;
  /**
   * 是否指定环境
   * @param env 环境
   */
  isEnv(env: IAppArgs['env']): boolean;
  /** 是否开发环境 */
  get isDev(): boolean;
  /** 是否测试环境 */
  get isDebug(): boolean;
  /** 是否发布环境 */
  get isProd(): boolean;
}
