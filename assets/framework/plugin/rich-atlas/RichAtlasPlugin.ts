import { ImageAsset, Label, Node, SpriteFrame, Texture2D } from 'cc';
import { PRESET_RES } from 'fast/config/Res';
import { PRESET_TOKEN } from 'fast/config/Token';
import { Plugin } from 'fast/foundation/Plugin';
import { be } from 'fast/util';

import { IAppPlugin } from '../app/IAppPlugin';
import { IProfilerPlugin } from '../profiler/IProfilerPlugin';
import { AutoAtlas } from './AutoAtlas';
import { AutoAtlasLevel } from './IAutoAtlas';
import { IHtxAtlasInfo, IHtxAtlasPlugin, IHtxStyle } from './IRichAtlasPlugin';

/**
 * 超级富文本模板
 */
class HtxTemplate extends Node {
  /** 文本组件 */
  private _renderer: Label;

  constructor() {
    super('hyper-text-template');
    this.layer = 0;
    this._renderer = this.addComponent(Label);
  }

  /**
   * 将文本和样式应用到渲染组件，并返回生成的图像资源
   */
  apply(ch: string, glyphKey: string, style: IHtxStyle) {
    const renderer = this._renderer;
    renderer.enabled = true;
    renderer.string = ch;
    renderer.fontFamily = style.fontFamily;
    renderer.fontSize = style.fontSize;
    renderer.color = style.color;
    renderer.isBold = style.bold;
    renderer.isItalic = style.italic;
    renderer.isUnderline = style.underline;
    if ((renderer.enableOutline = !!style.strokeColor)) {
      renderer.outlineColor = style.strokeColor;
      renderer.outlineWidth = style.strokeWidth;
    }
    if ((renderer.enableShadow = !!style.shadowColor)) {
      renderer.shadowColor = style.shadowColor;
      renderer.shadowOffset = style.shadowOffset;
      renderer.shadowBlur = style.shadowBlur;
    }
    renderer.updateRenderData(true);
    renderer.markForUpdateRenderData(false);

    const image = (renderer.ttfSpriteFrame!.texture as Texture2D).image!;
    image._uuid = glyphKey;

    return image;
  }

  /**
   * 释放资源
   */
  dismiss() {
    // @ts-ignore
    this._renderer?.destroyTtfSpriteFrame();
    this._renderer.enabled = false;
  }
}

/**
 * 超级富文本图集服务
 */
export class RichTextAtlasPlugin extends Plugin implements IHtxAtlasPlugin {
  public static readonly Token: string = PRESET_TOKEN.HYPER_TEXT_ATLAS;
  /** atlasKey -> 图集信息 */
  private _atlases: Map<string, IHtxAtlasInfo> = new Map();

  /** atlasKey -> 图集等级（控制 AutoAtlas 尺寸） */
  private _atlasLevels: Map<string, AutoAtlasLevel> = new Map();

  /** 用于生成 glyph 的临时节点 */
  private _template: HtxTemplate;

  protected readonly $dependencies: string[] = [PRESET_TOKEN.PROFILER, PRESET_TOKEN.APP];

  async onInitialize() {
    this.of<IProfilerPlugin>(PRESET_TOKEN.PROFILER).addDebugItem(PRESET_RES.HYPER_TEXT_ATLAS, '超级富文本图集', () => {
      const usage = this.getUsage();
      return [`数量: ${usage.atlasCount}`, `占用内存: ${usage.totalMemoryBytes / 1024 / 1024} MB`].join('\n');
    });

    this.configureAtlas(PRESET_RES.HYPER_TEXT_ATLAS, AutoAtlasLevel.XLarge);
    this._template = new HtxTemplate();
    this.of<IAppPlugin>(PRESET_TOKEN.APP).root.parent!.insertChild(this._template, 2);
  }

  configureAtlas(atlasKey: string, level: AutoAtlasLevel): void {
    if (this._atlasLevels.has(atlasKey)) {
      const oldLevel = AutoAtlasLevel[this._atlasLevels.get(atlasKey)!];
      this.logger.if('超级富文本图集 ⁅{0} => {1}⁆ 已配置，请注意合理分配图集标识和等级', atlasKey, oldLevel);
      return;
    }
    this._atlasLevels.set(atlasKey, level);
    this.logger.if('超级富文本图集 ⁅{0} => {1}⁆ 已添加', atlasKey, AutoAtlasLevel[level]);
  }

  destroy() {
    this.of<IProfilerPlugin>(PRESET_TOKEN.PROFILER).removeDebugItem(PRESET_RES.HYPER_TEXT_ATLAS);
    this._template.destroy();
    this._template = null!;
    this.shrinkAll();
  }

  /**
   * 获取或创建图集信息
   * @param atlasKey 图集标识
   */
  private _getOrCreateAtlas(atlasKey: string): IHtxAtlasInfo {
    let info = this._atlases.get(atlasKey);
    if (!info) {
      const level = this._atlasLevels.get(atlasKey) ?? AutoAtlasLevel.Medium;
      const size = level as number;
      const atlas = new AutoAtlas(atlasKey, {
        width: size,
        height: size,
        smart: true,
        border: 1,
        padding: 2,
      });
      info = {
        atlas,
        glyphs: new Map(),
        refCount: 0,
      };
      this._atlases.set(atlasKey, info);
    }
    return info;
  }

  measureGlyphMetrics(atlasKey: string, glyphKey: string) {
    const info = this._getOrCreateAtlas(atlasKey);

    const cached = info.glyphs.get(glyphKey);
    if (cached && cached.frame && cached.frame.isValid) {
      return {
        width: cached.frame.rect.width,
        height: cached.frame.rect.height,
      };
    }

    return null;
  }

  addRef(atlasKey: string): void {
    const info = this._getOrCreateAtlas(atlasKey);
    info.refCount++;
  }

  decRef(atlasKey: string): void {
    const info = this._atlases.get(atlasKey);
    if (!info) {
      return;
    }
    info.refCount--;
    if (info.refCount <= 0) {
      // 延迟实际清理交给 shrink / clearUnused
      info.refCount = 0;
    }
  }

  acquireGlyph(atlasKey: string, glyphKey: string, ch: string, style: IHtxStyle): SpriteFrame | null {
    const info = this._getOrCreateAtlas(atlasKey);

    const cached = info.glyphs.get(glyphKey);
    if (cached && cached.frame && cached.frame.isValid) {
      cached.lastUsed = Date.now();
      return cached.frame;
    }

    const image = this.createGlyphImage(ch, glyphKey, style);
    if (!info.atlas.has(glyphKey)) {
      info.atlas.add(glyphKey, image);
      this._template.dismiss();
    }

    const frame = info.atlas.acquire(glyphKey);
    if (!frame) {
      return null;
    }

    info.glyphs.set(glyphKey, {
      frame,
      lastUsed: Date.now(),
    });

    return frame;
  }

  createGlyphImage(ch: string, glyphKey: string, style: IHtxStyle): ImageAsset {
    return this._template.apply(ch, glyphKey, style);
  }

  clearUnused(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this._atlases.forEach((info, key) => {
      if (info.refCount > 0) {
        return;
      }
      // 简单策略：如果 30 秒内未被访问过，则销毁
      let latest = 0;
      info.glyphs.forEach((entry) => {
        if (entry.lastUsed > latest) {
          latest = entry.lastUsed;
        }
      });
      if (be.isEmpty(info.glyphs) || now - latest > 30_000) {
        info.atlas.destroy();
        info.glyphs.clear();
        toDelete.push(key);
      }
    });

    toDelete.forEach((key) => this._atlases.delete(key));
  }

  shrinkAll(): void {
    this.clearUnused();
  }

  getUsage() {
    const atlases: {
      atlasKey: string;
      width: number;
      height: number;
      memoryBytes: number;
      glyphCount: number;
      refCount: number;
    }[] = [];

    let totalMemoryBytes = 0;

    this._atlases.forEach((info, key) => {
      const level = this._atlasLevels.get(key) ?? AutoAtlasLevel.Medium;
      const size = level as number;
      const width = size;
      const height = size;
      const memoryBytes = width * height * 4; // RGBA8888 4 字节/像素
      const glyphCount = info.glyphs.size;

      totalMemoryBytes += memoryBytes;

      atlases.push({
        atlasKey: key,
        width,
        height,
        memoryBytes,
        glyphCount,
        refCount: info.refCount,
      });
    });

    return {
      atlasCount: atlases.length,
      totalMemoryBytes,
      atlases,
    };
  }
}
