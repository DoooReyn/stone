import { __private } from 'cc';
import { IPlugin } from 'fast/foundation/Plugin';

/** 语言类型 */
export type Language = __private._pal_system_info_enum_type_language__Language;

/** 语言包 */
export type LanguagePack = Record<string, string>;

/** 语言存储接口 */
export interface IStorageEntryLanguage {
  language: Language;
}

/**
 * 国际化工具接口
 */
export interface II18nPlugin extends IPlugin {
  /** 当前语言 */
  language: Language;

  /**
   * 是否支持指定语言
   * @param language 语言
   * @returns
   */
  isSupported(language: Language): boolean;

  /**
   * 获取多语言文本
   * @param id 文本编号
   * @returns 多语言文本
   */
  text(id: string): string;

  /**
   * 从语言包中获取多语言文本
   * @param packName 语言包名称
   * @param id 文本编号
   * @returns 多语言文本
   */
  textFrom(packName: string, id: string): string;

  /**
   * 格式化多语言文本
   * @param id 文本编号
   * @param args 参数列表
   * @returns 格式化后的多语言文本
   */
  fmt(id: string, ...args: any[]): string;

  /**
   * 从语言包中获取并格式化多语言文本
   * @param packName 语言包名称
   * @param id 文本编号
   * @param args 参数列表
   * @returns 格式化后的多语言文本
   */
  fmtFrom(packName: string, id: string, ...args: any[]): string;

  /**
   * 添加语言包
   * @param language 语言
   * @param packName 语言包名称
   * @param packData 语言包数据
   */
  addPack(language: Language, packName: string, packData: LanguagePack): void;

  /**
   * 移除语言包
   * @param language 语言
   * @param packName 语言包名称
   */
  removePack(language: Language, packName: string): void;

  /**
   * 清除所有语言的语言包
   */
  clear(): void;
}
