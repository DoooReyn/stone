import { sys } from 'cc';
import { PRESET_EVENT_NAME } from 'fast/config/Event';
import { PRESET_STORAGE } from 'fast/config/Storage';
import { PRESET_TOKEN } from 'fast/config/Token';
import { Plugin } from 'fast/foundation/Plugin';
import { IArgParserPlugin } from 'fast/plugin/arg-parser/IArgParser';
import { IEventBusPlugin } from 'fast/plugin/event-bus/IEventBusPlugin';
import { IStoragePlugin } from 'fast/plugin/storage/IStoragePlugin';
import { literal } from 'fast/util';

import { II18nPlugin, IStorageEntryLanguage, Language, LanguagePack } from './II18nPlugin';

/**
 * 国际化工具
 */
export class I18nPlugin extends Plugin implements II18nPlugin {
  public static readonly Token: string = PRESET_TOKEN.I18N;

  /** 当前语言 */
  private _current: Language = sys.Language.CHINESE;

  /** 支持的语言列表 */
  private readonly _supported: Set<Language> = new Set();

  /** 语言包容器 */
  private readonly _container: Map<Language, Map<string, LanguagePack>> = new Map();

  protected readonly $dependencies: string[] = [PRESET_TOKEN.ARG_PARSER, PRESET_TOKEN.STORAGE, PRESET_TOKEN.EVENT_BUS];

  get language() {
    return this._current;
  }
  set language(lang: Language) {
    this._current = lang;
    this.of<IStoragePlugin>(PRESET_TOKEN.STORAGE).itemOf<IStorageEntryLanguage>(
      PRESET_STORAGE.LANGUAGE
    )!.data!.language = lang;
    this.of<IEventBusPlugin>(PRESET_TOKEN.EVENT_BUS).app.emit(PRESET_EVENT_NAME.LANGUAGE_CHANGED, this._current);
  }

  async onInitialize() {
    const languages = this.of<IArgParserPlugin>(PRESET_TOKEN.ARG_PARSER).args.languages;
    // 添加支持的语言
    for (let i = 0; i < languages.length; i++) {
      this._supported.add(languages[i]);
    }

    // 设置当前语言
    // 1. 如果本地已经有记录，则使用本地缓存的语言
    // 2. 如果没有本地记录，则使用当前系统的语言
    // 3. 如果系统语言不在支持列表中，则使用传入的语言
    const storage = this.of<IStoragePlugin>(PRESET_TOKEN.STORAGE);
    // 先查询语言缓存
    const cache = storage.itemOf<IStorageEntryLanguage>(PRESET_STORAGE.LANGUAGE);
    // 再注册语言存储项
    storage.register<IStorageEntryLanguage>(PRESET_STORAGE.LANGUAGE, { language: this._current });
    if (cache) {
      // 使用缓存语言
      this.language = cache.data!.language;
      this.logger.i(`使用缓存语言 ${this.language}`);
    } else {
      const lang = sys.language;
      if (this._supported.has(lang)) {
        // 使用系统语言
        this.language = lang;
        this.logger.i(`使用系统语言 ${this.language}`);
      } else {
        // 使用传入语言
        this.language = languages[0];
        this.logger.i(`使用传入语言 ${this.language}`);
      }
    }
  }

  isSupported(language: Language) {
    return this._supported.has(language);
  }

  text(id: string) {
    if (this._container.has(this._current)) {
      const dictionaries = this._container.get(this._current)!;
      for (let [, dictionary] of dictionaries) {
        if (dictionary[id] != undefined) {
          return dictionary[id];
        }
      }
    }

    this.logger.w(`未找到文本编号 ${id}`);

    return 'xxx@' + id;
  }

  textFrom(name: string, id: string) {
    if (this._container.has(this._current)) {
      const dictionaries = this._container.get(this._current)!;
      if (dictionaries.has(name)) {
        const dictionary = dictionaries.get(name)!;
        const text = dictionary[id];
        if (text != undefined) {
          return text;
        }
      }
    }

    this.logger.w(`语言包${name}中不存在文本编号${id}`);

    return name + '@' + id;
  }

  fmt(id: string, ...args: []): string {
    return literal.fmt(this.text(id), ...args);
  }

  fmtFrom(packName: string, id: string, ...args: any[]): string {
    return literal.fmt(this.textFrom(packName, id), ...args);
  }

  addPack(language: Language, packName: string, packData: LanguagePack) {
    this._supported.add(language);
    if (this._container.has(language)) {
      const dictionaries = this._container.get(language)!;
      dictionaries.set(packName, packData);
      this.logger.w(`更新 ${language} 语言包 ${packName}`);
    } else {
      const dictionaries = new Map();
      this._container.set(language, dictionaries);
      dictionaries.set(packName, packData);
      this.logger.d(`添加 ${language} 语言包 ${packName}`);
    }
  }

  removePack(language: Language, name: string) {
    if (this._container.has(language)) {
      const dictionary = this._container.get(language)!;
      dictionary.delete(name);
      this.logger.d(`删除 ${language} 语言包 ${name}`);
      if (dictionary.size === 0) {
        this._container.delete(language);
      }
    }
  }

  clear() {
    this._supported.clear();
    this._container.clear();
  }
}
