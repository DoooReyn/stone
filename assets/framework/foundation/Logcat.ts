import { sys } from 'cc';
import { VoidFn } from 'fast/Types';
import { fmt } from 'fast/util/Literal';

import { KVPair } from './KVPair';

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
 * - DEBUG 🐱
 * - INFO 🐶
 * - WARN 🐯
 * - ERROR 🪳
 */
const FLAGS: Record<keyof typeof LogLevel, string> = {
  DEBUG: '🐱',
  INFO: '🐶',
  WARN: '🐯',
  ERROR: '🪳',
  NONE: '🦢',
} as const;

/**
 * 日志颜色
 */
const COLORS: Record<keyof typeof LogLevel, string> = {
  DEBUG: 'border: solid 1px #808080;color:#808080;',
  INFO: 'border: solid 2px #4ba4dc;font-weight:bold;color:#4ba4dc;',
  WARN: 'border: solid 2px #d518fb;font-weight:bolder;color:#d518fb;',
  ERROR: 'border: solid 2px #e74032;font-weight:bolder;color:#e74032;',
  NONE: 'border: solid 1px #ffffff;',
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
  public constructor(public readonly token: string, public level: LogLevel = LogLevel.DEBUG) {}

  /**
   * 输出日志
   * @param level 输出等级
   * @param args 入参
   */
  private _output(level: LogLevel, ...args: any[]): void {
    if (this.level <= level) {
      const useColor = sys.isBrowser && (sys.os === sys.OS.WINDOWS || sys.os === sys.OS.OSX);
      const now = new Date();
      const key = LogLevel[level] as keyof typeof LogLevel;
      const flag = FLAGS[key];
      const color = COLORS[key];
      const prefix = `${flag} ${now.toLocaleTimeString()}.${now.getMilliseconds()} ${this.token}`;
      const out: { token: string; content: any; timestamp: number; stack?: string } = {
        token: this.token,
        content: args,
        timestamp: now.getTime(),
      };

      if (level >= LogLevel.WARN) {
        out.stack = new Error().stack?.split('\n').slice(2).join('\n') ?? '';
        if (args.length === 1 && typeof args[0] === 'string') {
          if (useColor) {
            console.log('%c%s', color, prefix, args[0], `\n${out.stack}`);
          } else {
            console.log(prefix, args[0], `\n${out.stack}`);
          }
        } else {
          if (useColor) {
            console.log('%c%s', color, prefix, ...args, `\n${out.stack}`);
          } else {
            console.log(prefix, ...args, `\n${out.stack}`);
          }
        }
      } else {
        if (args.length === 1 && typeof args[0] === 'string') {
          if (useColor) {
            console.log('%c%s', color, prefix, args[0]);
          } else {
            console.log(prefix, args[0]);
          }
        } else {
          if (useColor) {
            console.log('%c%s', color, prefix, ...args);
          } else {
            console.log(prefix, ...args);
          }
        }
      }
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
  public d = this._output.bind(this, LogLevel.DEBUG) as VoidFn;
  /** 输出一般日志 */
  public i = this._output.bind(this, LogLevel.INFO) as VoidFn;
  /** 输出警告日志 */
  public w = this._output.bind(this, LogLevel.WARN) as VoidFn;
  /** 输出错误日志 */
  public e = this._output.bind(this, LogLevel.ERROR) as VoidFn;

  /** 格式化输出调试日志 */
  public df = this._fmt.bind(this, LogLevel.DEBUG) as VoidFn;
  /** 格式化输出一般日志 */
  public if = this._fmt.bind(this, LogLevel.INFO) as VoidFn;
  /** 格式化输出警告日志 */
  public wf = this._fmt.bind(this, LogLevel.WARN) as VoidFn;
  /** 格式化输出错误日志 */
  public ef = this._fmt.bind(this, LogLevel.ERROR) as VoidFn;
}

/**
 * 日志容器
 * @exports
 */
export const logcat = new KVPair<Logger>(Logger);
