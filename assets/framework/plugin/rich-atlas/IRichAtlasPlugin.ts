import { Color, ImageAsset, SpriteFrame, Vec2 } from 'cc';
import { IPlugin } from 'fast/foundation/Plugin';

import { AutoAtlasLevel, IAutoAtlas, IAutoAtlasUsageSummary } from './IAutoAtlas';

/**
 * 超级富文本图集条目尺寸
 */
export interface IHtxGlyphMetrics {
  width: number;
  height: number;
}

/**
 * 超级富文本样式
 */
export interface IHtxStyle {
  fontFamily: string;
  fontSize: number;
  color: Color;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strokeColor: Color | null;
  strokeWidth: number;
  shadowColor: Color | null;
  shadowOffset: Vec2;
  shadowBlur: number;
  linkId: string | null;
}

/**
 * 超级富文本字符信息
 */
export interface IHtxGlyph {
  ch: string;
  style: IHtxStyle;
}

/**
 * 超级富文本布局后的 glyph
 */
export interface IHtxLayoutGlyph extends IHtxGlyph {
  x: number;
  y: number;
  glyphKey: string;
}

/**
 * 超级富文本图集信息
 */
export interface IHtxAtlasInfo {
  /** 自动图集 */
  atlas: IAutoAtlas;
  /** glyphKey -> SpriteFrame */
  glyphs: Map<string, IHtxAtlasGlyphEntry>;
  /** 引用计数，来自各个 RichText 组件 */
  refCount: number;
}

/**
 * 超级富文本图集条目
 */
export interface IHtxAtlasGlyphEntry {
  /** 引用的 SpriteFrame */
  frame: SpriteFrame;
  /** 最近一次被访问的时间戳，用于简单 LRU */
  lastUsed: number;
}

/**
 * 超级富文本图集插件接口
 */
export interface IHtxAtlasPlugin extends IPlugin {
  /**
   * 为指定图集标识配置等级（纹理尺寸）
   * - 同一个 atlasKey 多次配置时，以最后一次为准
   */
  configureAtlas(atlasKey: string, level: AutoAtlasLevel): void;

  /**
   * 获取 glyph 的尺寸（如果已在图集中缓存）
   * @param atlasKey 图集标识
   * @param glyphKey glyph 样式标识（包含字体、字号、颜色、描边等）
   * @returns glyph 的尺寸，如果未缓存则返回 null
   */
  measureGlyphMetrics(atlasKey: string, glyphKey: string): IHtxGlyphMetrics | null;

  /**
   * 增加图集引用计数
   */
  addRef(atlasKey: string): void;

  /**
   * 减少图集引用计数
   */
  decRef(atlasKey: string): void;

  /**
   * 获取或创建 glyph 的 SpriteFrame
   * @param atlasKey 图集标识
   * @param glyphKey glyph 样式标识（包含字体、字号、颜色、描边等）
   * @param ch 字符（可能是合并后的下划线片段）
   * @param style 样式
   */
  acquireGlyph(atlasKey: string, glyphKey: string, ch: string, style: IHtxStyle): SpriteFrame | null;

  /**
   * 创建 glyph 图片（底层实现使用 Label 渲染成图像）
   * @param ch 字符
   * @param glyphKey glyph 样式标识
   * @param style 样式
   */
  createGlyphImage(ch: string, glyphKey: string, style: IHtxStyle): ImageAsset;

  /**
   * 清理引用计数为 0 的图集（根据简单 LRU 策略）
   */
  clearUnused(): void;

  /**
   * 收紧所有图集（当前等价于 clearUnused，预留扩展）
   */
  shrinkAll(): void;

  /**
   * 查询当前所有图集的占用情况，包括图集数量和总内存占用
   */
  getUsage(): IAutoAtlasUsageSummary;
}
