import { PRESET_TOKEN } from 'fast/config/Token';
import { Plugin } from 'fast/foundation/Plugin';

import { IGlobalPlugin } from '../global/IGlobalPlugin';
import { ErrorReporter, ICatcherPlugin } from './ICatcherPlugin';

/**
 * 异常捕获服务
 */
export class Catcher extends Plugin implements ICatcherPlugin {
  public static Token: string = PRESET_TOKEN.CATCHER;

  /** 错误报告方法 */
  private _reporter: ErrorReporter;

  setErrorReporter(handle: ErrorReporter): void {
    this._reporter = handle;
  }

  constructor() {
    super();

    const self = this;
    const gg = this.of<IGlobalPlugin>(PRESET_TOKEN.GLOBAL);
    if (gg.has('addEventListener')) {
      const addEventListener = gg.get<Function>('addEventListener')!;
      addEventListener('unhandledrejection', function (event: PromiseRejectionEvent) {
        self.logger.e('捕获到异步错误\n', event.reason);
        if (self._reporter) {
          self._reporter({
            message: 'Unhandled Promise Rejection',
            reason: event.reason,
          });
        }
      });
      addEventListener('error', function (event: ErrorEvent) {
        self.logger.e('捕获到同步错误\n', event.error);
        if (self._reporter && event && event.error) {
          self._reporter({
            message: event.error.message,
            stack: event.error.stack,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          });
        }
      });
    }
  }
}
