import { v2, _decorator, CacheMode, HorizontalTextAlignment, Label, Overflow, VerticalTextAlignment } from 'cc';
import { PRESET_GUI } from 'fast/config/Gui';
import { PRESET_TOKEN } from 'fast/config/Token';
import { fast } from 'fast/Fast';
import { IResLoaderPlugin } from 'fast/plugin/res/IResLoaderPlugin';
import { be, color } from 'fast/util';

import { Gem } from '../Gem';

const { ccclass, menu, property, requireComponent } = _decorator;

/**
 * 文本样式
 */
export interface ITextStyle {
  /** 字体 */
  font: Partial<{
    /** 字体族，系统字体直接使用名称，资源字体使用 'l:' 前缀 */
    family: string;
    /** 字号 */
    size: number;
    /** 颜色，十六进制格式 */
    color: string;
    /** 行高 */
    lineHeight: number;
    /** 自动换行 */
    autoWrap: boolean;
  }>;
  /** 修饰 */
  decor: Partial<{
    /** 加粗 */
    bold: boolean;
    /** 倾斜 */
    italic: boolean;
    /** 下划线 */
    underline: boolean;
  }>;
  /** 描边 */
  outline: Partial<{
    /** 颜色，十六进制格式 */
    color: string;
    /** 宽度，0 表示禁用 */
    width: number;
  }>;
  /** 阴影 */
  shadow: Partial<{
    /** 颜色，十六进制格式 */
    color: string;
    /** X 轴偏移 */
    x: number;
    /** Y 轴偏移 */
    y: number;
    /** 模糊半径，0 表示禁用 */
    blur: number;
  }>;
  /** 对齐 */
  alignment: Partial<{
    /** 水平对齐 */
    h: HorizontalTextAlignment;
    /** 垂直对齐 */
    v: VerticalTextAlignment;
  }>;
  /** 溢出处理 */
  overflow: Overflow;
  /** 缓存模式 */
  cacheMode: CacheMode;
}

/**
 * 文本组件，封装 Label 提供样式设置能力
 */
@ccclass('Text')
@menu('Gem/Text')
@requireComponent(Label)
export class Text extends Gem {
  @property({ tooltip: '使用默认字体' })
  public readonly useDefaultFont: boolean = true;

  get label() {
    return this.getComponent(Label)!;
  }

  get text() {
    return this.label.string;
  }

  set text(text: string) {
    this.label.string = text;
  }

  /**
   * 应用字体，支持系统字体和资源加载字体
   * 资源字体以 'l:' 前缀标识，异步加载以避免阻塞主线程
   */
  private applyFontFamily(family: string) {
    if (family.startsWith('l:')) {
      const loader = fast.acquire<IResLoaderPlugin>(PRESET_TOKEN.RES_LOADER);
      loader.loadFont(family).then((font) => {
        if (font) {
          this.label.useSystemFont = false;
          this.label.font = font;
        } else {
          this.label.useSystemFont = true;
          this.label.fontFamily = 'Arial';
        }
      });
    } else {
      this.label.useSystemFont = true;
      this.label.fontFamily = family;
    }
  }

  /**
   * 判断是否应该应用样式属性
   * @param onlySpecified 为 true 时仅应用明确指定的属性，避免覆盖默认值
   */
  private shouldApply(value: unknown, onlySpecified: boolean): boolean {
    return !onlySpecified || be.notUndefined(value);
  }

  /**
   * 批量设置文本样式
   * @param onlySpecified 是否仅应用指定属性，默认 true
   * @notes
   * - onlySpecified 为 true 时仅应用 style 中明确指定的属性
   * - onlySpecified 为 false 时非指定属性将使用默认值
   */
  setStyle(style: Partial<ITextStyle>, onlySpecified: boolean = true) {
    // 应用字体
    const font = { ...PRESET_GUI.TEXT_FONT, ...style.font };
    if (this.shouldApply(style.font?.family, onlySpecified)) this.applyFontFamily(font.family);
    if (this.shouldApply(style.font?.size, onlySpecified)) this.label.fontSize = font.size;
    if (this.shouldApply(style.font?.lineHeight, onlySpecified)) this.label.lineHeight = font.lineHeight;
    if (this.shouldApply(style.font?.autoWrap, onlySpecified)) this.label.enableWrapText = font.autoWrap;
    if (this.shouldApply(style.font?.color, onlySpecified)) this.label.color = color.from(font.color);

    // 应用修饰
    const decor = { ...PRESET_GUI.TEXT_DECOR, ...style.decor };
    if (this.shouldApply(style.decor?.bold, onlySpecified)) this.label.isBold = decor.bold;
    if (this.shouldApply(style.decor?.italic, onlySpecified)) this.label.isItalic = decor.italic;
    if (this.shouldApply(style.decor?.underline, onlySpecified)) this.label.isUnderline = decor.underline;

    // 应用描边
    const outline = { ...PRESET_GUI.TEXT_OUTLINE, ...style.outline };
    if (this.shouldApply(style.outline?.width, onlySpecified) && outline.width > 0) {
      this.label.enableOutline = true;
      this.label.outlineWidth = outline.width;
      if (this.shouldApply(style.outline?.color, onlySpecified)) {
        this.label.outlineColor = color.from(outline.color);
      }
    } else {
      this.label.enableOutline = false;
    }

    // 应用阴影
    const shadow = { ...PRESET_GUI.TEXT_SHADOW, ...style.shadow };
    if (this.shouldApply(style.shadow?.blur, onlySpecified) && shadow.blur > 0) {
      this.label.enableShadow = true;
      this.label.shadowBlur = shadow.blur;
      if (this.shouldApply(style.shadow?.color, onlySpecified)) {
        this.label.shadowColor = color.from(shadow.color);
      }
      if (this.shouldApply(style.shadow?.x, onlySpecified) && this.shouldApply(style.shadow?.y, onlySpecified)) {
        this.label.shadowOffset = v2(shadow.x, shadow.y);
      }
    } else {
      this.label.enableShadow = false;
    }

    // 应用对齐
    const alignment = { ...PRESET_GUI.TEXT_ALIGNMENT, ...style.alignment };
    if (this.shouldApply(style.alignment?.h, onlySpecified)) this.label.horizontalAlign = alignment.h;
    if (this.shouldApply(style.alignment?.v, onlySpecified)) this.label.verticalAlign = alignment.v;

    // 应用溢出处理
    if (this.shouldApply(style.overflow, onlySpecified))
      this.label.overflow = style.overflow ?? PRESET_GUI.TEXT_OVERFLOW;

    // 应用缓存模式
    if (this.shouldApply(style.cacheMode, onlySpecified))
      this.label.cacheMode = style.cacheMode ?? PRESET_GUI.TEXT_CACHE_MODE;
  }

  /**
   * 强制更新渲染数据
   * @notes 用于异步加载字体后刷新显示，避免字体切换后文本不显示
   */
  flush() {
    this.label.updateRenderData(true);
  }

  protected didCreate(): void {
    this.node.acquire(Label);
  }
}
