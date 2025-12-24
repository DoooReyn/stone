import { PRESET_TOKEN } from 'fast/config/Token';
import { Plugin } from 'fast/foundation/Plugin';
import { Dict } from 'fast/Types';
import { json, lzs, platform } from 'fast/util';

import { IArgParserPlugin } from '../arg-parser/IArgParser';
import { IStorageModem, IStoragePlugin } from './IStoragePlugin';
import { StorageEntry } from './StorageEntry';

/**
 * 本地存储容器服务
 */
export class StoragePlugin extends Plugin implements IStoragePlugin {
  public static readonly Token: string = PRESET_TOKEN.STORAGE;
  /** 存储条目容器 */
  private readonly _container: Map<string, StorageEntry<Dict>> = new Map();

  public readonly modem: IStorageModem;

  constructor() {
    super();

    const argParser = this.of<IArgParserPlugin>(PRESET_TOKEN.ARG_PARSER);
    const isBrowser = platform.browser;
    this.modem = {
      generateKey(token: string) {
        if (argParser.isDev && isBrowser) {
          const user = argParser.args.user ?? 'guest';
          return `[${argParser.args.appName}]@${user}:${token}`;
        } else {
          return `[${argParser.args.appName}]:${token}`;
        }
      },
      encode<T extends Dict>(data: T) {
        if (argParser.isProd) {
          return lzs.encodeToBase64(json.encode(data));
        } else {
          return json.encode(data);
        }
      },
      decode<T extends Dict>(data: string): T | undefined {
        if (argParser.isProd) {
          return json.decode(lzs.decodeFromBase64(data)!) as T;
        } else {
          return json.decode(data) as T;
        }
      },
    };
  }

  public register<T extends object>(alias: string, template: T) {
    if (!this._container.has(alias)) {
      this._container.set(alias, new StorageEntry(alias, template, this.modem));
    }
  }

  public unregister(alias: string) {
    this._container.delete(alias);
  }

  public save(alias?: string) {
    if (alias === undefined) {
      this._container.forEach((v) => v.save());
    } else {
      this._container.get(alias)?.save();
    }
  }

  public load(alias?: string) {
    if (alias === undefined) {
      this._container.forEach((v) => v.load());
    } else {
      this._container.get(alias)?.load();
    }
  }

  public itemOf<T extends object>(alias: string): StorageEntry<T> | undefined {
    return this._container.get(alias) as StorageEntry<T> | undefined;
  }
}
