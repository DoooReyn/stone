import { PRESET_APP_ARGS } from 'fast/config/AppArgs';
import { PRESET_TOKEN } from 'fast/config/Token';
import { Plugin } from 'fast/foundation/Plugin';
import { Dict } from 'fast/Types';
import { dict } from 'fast/util';

import { IGlobalPlugin } from '../global/IGlobalPlugin';
import { IAppArgs } from './IAppArgs';
import { IArgParserPlugin } from './IArgParser';

/**
 * 参数解析器插件
 */
export class ArgParserPlugin extends Plugin implements IArgParserPlugin {
  static readonly Token: string = PRESET_TOKEN.ARG_PARSER;

  /** 参数 */
  public args: IAppArgs = dict.deepCopy(PRESET_APP_ARGS) as IAppArgs;

  protected readonly $dependencies: string[] = [PRESET_TOKEN.GLOBAL];

  async onInitialize() {
    this.parse();
  }

  parse(args?: Dict) {
    const gg = this.of<IGlobalPlugin>(PRESET_TOKEN.GLOBAL);
    if (gg.has('location')) {
      const url = gg.get<Location>('location')?.href ?? '';
      const query = url.split('?');
      if (query.length == 2) {
        const pairs = query[1].split('&');
        for (let i = 0, l = pairs.length, key: string, value: string; i < l; i++) {
          [key, value] = pairs[i].split('=');
          this.args[key] = decodeURIComponent(value || '');
        }
      }
    }

    if (args !== undefined) {
      this.args = { ...this.args, ...args };
    }

    this.logger.d('应用参数', this.args);
  }

  isEnv(env: IAppArgs['env']) {
    return this.args.env === env;
  }

  get isDev() {
    return this.isEnv('dev');
  }

  get isDebug() {
    return this.isEnv('debug');
  }

  get isProd() {
    return this.isEnv('prod');
  }
}
