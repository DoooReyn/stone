import { KVPair } from './KVPair';
import { VoidFn } from './Types';
import { fmt } from './util/Literal';

/**
 * 日志等级
 *
 * - DEBUG 调试
 * - INFO 一般
 * - WARN 警告
 * - ERROR 错误
 * - NONE 无
 */
export enum LogLevel {
  DEBUG = 1,
  INFO,
  WARN,
  ERROR,
  NONE = 99,
}

/**
 * 日志标记
 *
 * - DEBUG 🐤
 * - INFO 🐓
 * - WARN 🦩
 * - ERROR 🐦
 */
const FLAGS: Record<keyof typeof LogLevel, string> = {
  DEBUG: '🐤',
  INFO: '🐓',
  WARN: '🦩',
  ERROR: '🐦',
  NONE: '🦢',
} as const;

/**
 * 日志
 */
export class Logger {
  /**
   * 构造函数
   * @param token 标识
   * @param level 等级
   */
  constructor(public readonly token: string, public level: LogLevel = LogLevel.DEBUG) {}

  /**
   * 输出日志
   * @param level 输出等级
   * @param args 入参
   */
  private _output(level: LogLevel, args: any): void {
    if (this.level <= level) {
      const key = LogLevel[level] as keyof typeof LogLevel;
      const flag = FLAGS[key];
      const out: { token: string; content: any; timestamp: number; stack?: string } = {
        token: this.token,
        content: args,
        timestamp: Date.now(),
      };
      if (level >= LogLevel.ERROR) {
        out.stack = new Error().stack?.split('\n').slice(2).join('\n') ?? '';
      }
      console.log(flag + ' ' + this.token, out);
    }
  }

  /**
   * 格式化输出日志
   * @param level 输出等级
   * @param template 模板字符串
   * @param args 入参
   */
  private _fmt(level: LogLevel, template: string, ...args: any[]) {
    if (this.level <= level) {
      this._output(level, fmt(template, ...args));
    }
  }

  /** 输出调试日志 */
  d = this._output.bind(this, LogLevel.DEBUG) as VoidFn;
  /** 输出一般日志 */
  i = this._output.bind(this, LogLevel.INFO) as VoidFn;
  /** 输出警告日志 */
  w = this._output.bind(this, LogLevel.WARN) as VoidFn;
  /** 输出错误日志 */
  e = this._output.bind(this, LogLevel.ERROR) as VoidFn;

  /** 格式化输出调试日志 */
  df = this._fmt.bind(this, LogLevel.DEBUG) as VoidFn;
  /** 格式化输出一般日志 */
  if = this._fmt.bind(this, LogLevel.INFO) as VoidFn;
  /** 格式化输出警告日志 */
  wf = this._fmt.bind(this, LogLevel.WARN) as VoidFn;
  /** 格式化输出错误日志 */
  ef = this._fmt.bind(this, LogLevel.ERROR) as VoidFn;
}

/**
 * 日志容器
 * @exports
 */
export const logcat = new KVPair<Logger>(Logger);
