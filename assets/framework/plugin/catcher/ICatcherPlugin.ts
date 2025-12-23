import { IPlugin } from 'fast/foundation/Plugin';

/** 错误报告方法 */
export type ErrorReporter = (info: Object) => void;

/**
 * 异常捕获服务接口
 */
export interface ICatcherPlugin extends IPlugin {
  /**
   * 设置错误报告方法
   * @param handle 报告方法
   */
  setErrorReporter(handle: ErrorReporter): void;
}
