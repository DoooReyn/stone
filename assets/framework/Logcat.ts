import { CRUD } from './CRUD';
import { fmt } from './util/Literal';

export enum LogLevel {
  DEBUG = 1,
  INFO,
  WARN,
  ERROR,
  FATAL,
  NONE = 99,
}

type OutputHdl = (level: LogLevel, ...args: any[]) => void;
type FmtHdl = (level: LogLevel, template: string, ...args: any[]) => void;
type LocateHdl = (token: string, ...args: any[]) => void;
type AnyHdl = (...args: any[]) => void;

const LOCATOR: { [key: number]: LocateHdl } = {
  [LogLevel.DEBUG]: console.log.bind(console, 'D'),
  [LogLevel.INFO]: console.log.bind(console, 'I'),
  [LogLevel.WARN]: console.log.bind(console, 'W'),
  [LogLevel.ERROR]: console.log.bind(console, 'E'),
  [LogLevel.FATAL]: console.log.bind(console, 'F'),
  [LogLevel.NONE]: (...args: any[]) => {},
};

export class Logger {
  constructor(public readonly token: string, public level: LogLevel = LogLevel.DEBUG) {}

  private _output(level: LogLevel, ...args: any[]): void {
    if (this.level <= level) {
      LOCATOR[level](`<${this.token}>`, ...args);
    }
  }

  private _fmt(level: LogLevel, template: string, ...args: any[]) {
    if (this.level <= level) {
      LOCATOR[level](`<${this.token}>`, fmt(template, ...args));
    }
  }

  d = this._output.bind(this, LogLevel.DEBUG) as AnyHdl;
  i = this._output.bind(this, LogLevel.INFO) as AnyHdl;
  w = this._output.bind(this, LogLevel.WARN) as AnyHdl;
  e = this._output.bind(this, LogLevel.ERROR) as AnyHdl;
  f = this._output.bind(this, LogLevel.FATAL) as AnyHdl;

  df = this._fmt.bind(this, LogLevel.DEBUG) as AnyHdl;
  if = this._fmt.bind(this, LogLevel.INFO) as AnyHdl;
  wf = this._fmt.bind(this, LogLevel.WARN) as AnyHdl;
  ef = this._fmt.bind(this, LogLevel.ERROR) as AnyHdl;
  ff = this._fmt.bind(this, LogLevel.FATAL) as AnyHdl;
}

export const logcat = new CRUD<Logger>(Logger);
