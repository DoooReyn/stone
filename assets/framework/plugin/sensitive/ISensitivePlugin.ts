import { IPlugin } from 'fast/foundation/Plugin';

/**
 * 敏感词过滤器插件接口
 */
export interface ISensitivePlugin extends IPlugin {
  /**
   * 手动设置干扰词，不设置时将采用默认干扰词
   * @param noiseWords
   */
  setNoiseWords(noiseWords: string): void;
  /**
   * 清空敏感词
   */
  clearWords(): void;
  /**
   * 添加敏感词
   * @param wordList 敏感词数组
   */
  addWords(wordList: string[]): void;
  /**
   * 添加敏感词
   * @param word 敏感词
   */
  addWord(word: string): void;
  /**
   * 在内容中匹配敏感词
   * @param content 待匹配文本内容
   * @return 匹配到的敏感词数组
   */
  match(content: string): string[];
  /**
   * 检测文本中是否包含敏感词
   * @param content 待匹配文本内容
   * @return 是否包含敏感词
   */
  verify(content: string): boolean;
  /**
   * 对文本中的敏感词进行过滤
   * @param content 待匹配文本内容
   * @param filterChar 敏感词替代符，默认为'*'
   * @return 过滤后的文本
   */
  filter(content: string, filterChar: string): string;
}
