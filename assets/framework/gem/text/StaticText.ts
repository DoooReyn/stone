import { v2, _decorator, CacheMode, HorizontalTextAlignment, Label, Overflow, VerticalTextAlignment } from 'cc';
import { PRESET_GUI } from 'fast/config/Gui';
import { PRESET_TOKEN } from 'fast/config/Token';
import { fast } from 'fast/Fast';
import { IResLoaderPlugin } from 'fast/plugin/res/IResLoaderPlugin';
import { be, color } from 'fast/util';
import { unset } from 'fast/util/Dict';

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

  protected get renderer() {
    return this.getComponent(Label)!;
  }

  get text() {
    return this.renderer.string;
  }

  set text(text: string) {
    this.renderer.string = text;
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
          this.renderer.useSystemFont = false;
          this.renderer.font = font;
        } else {
          this.renderer.useSystemFont = true;
          this.renderer.fontFamily = 'Arial';
        }
      });
    } else {
      this.renderer.useSystemFont = true;
      this.renderer.fontFamily = family;
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
    if (this.shouldApply(style.font?.family, onlySpecified)) {
      this.applyFontFamily(font.family);
    }
    if (this.shouldApply(style.font?.size, onlySpecified)) {
      this.renderer.fontSize = font.size;
    }
    if (this.shouldApply(style.font?.lineHeight, onlySpecified)) {
      this.renderer.lineHeight = font.lineHeight;
    }
    if (this.shouldApply(style.font?.autoWrap, onlySpecified)) {
      this.renderer.enableWrapText = font.autoWrap;
    }
    if (this.shouldApply(style.font?.color, onlySpecified)) {
      this.renderer.color = color.from(font.color);
    }

    // 应用修饰
    const decor = { ...PRESET_GUI.TEXT_DECOR, ...style.decor };
    if (this.shouldApply(style.decor?.bold, onlySpecified)) {
      this.renderer.isBold = decor.bold;
    }
    if (this.shouldApply(style.decor?.italic, onlySpecified)) {
      this.renderer.isItalic = decor.italic;
    }
    if (this.shouldApply(style.decor?.underline, onlySpecified)) {
      this.renderer.isUnderline = decor.underline;
    }

    // 应用描边
    const outline = { ...PRESET_GUI.TEXT_OUTLINE, ...style.outline };
    if (this.shouldApply(style.outline?.width, onlySpecified) && outline.width > 0) {
      this.renderer.enableOutline = true;
      this.renderer.outlineWidth = outline.width;
      if (this.shouldApply(style.outline?.color, onlySpecified)) {
        this.renderer.outlineColor = color.from(outline.color);
      }
    } else {
      if (this.shouldApply(style.outline, onlySpecified)) {
        this.renderer.enableOutline = false;
      }
    }

    // 应用阴影
    const shadow = { ...PRESET_GUI.TEXT_SHADOW, ...style.shadow };
    if (this.shouldApply(style.shadow?.blur, onlySpecified) && shadow.blur > 0) {
      this.renderer.enableShadow = true;
      this.renderer.shadowBlur = shadow.blur;
      if (this.shouldApply(style.shadow?.color, onlySpecified)) {
        this.renderer.shadowColor = color.from(shadow.color);
      }
      if (this.shouldApply(style.shadow?.x, onlySpecified) && this.shouldApply(style.shadow?.y, onlySpecified)) {
        this.renderer.shadowOffset = v2(shadow.x, shadow.y);
      }
    } else {
      if (this.shouldApply(style.shadow, onlySpecified)) {
        this.renderer.enableShadow = false;
      }
    }

    // 应用对齐
    const alignment = { ...PRESET_GUI.TEXT_ALIGNMENT, ...style.alignment };
    if (this.shouldApply(style.alignment?.h, onlySpecified)) {
      this.renderer.horizontalAlign = alignment.h;
    }
    if (this.shouldApply(style.alignment?.v, onlySpecified)) {
      this.renderer.verticalAlign = alignment.v;
    }

    // 应用溢出处理
    if (this.shouldApply(style.overflow, onlySpecified)) {
      this.renderer.overflow = style.overflow ?? PRESET_GUI.TEXT_OVERFLOW;
    }

    // 应用缓存模式
    if (this.shouldApply(style.cacheMode, onlySpecified)) {
      this.renderer.cacheMode = style.cacheMode ?? PRESET_GUI.TEXT_CACHE_MODE;
    }
  }

  /** 字体 */
  public readonly font: {
    get(): {
      family: string | undefined;
      color: string;
      size: number;
      lineHeight: number;
      autoWrap: boolean;
    };
    set(font: ITextStyle['font'], onlySpecified?: boolean): void;
  } = (function (ref: Text) {
    return {
      get() {
        return {
          family: ref.renderer.useSystemFont ? ref.renderer.fontFamily : ref.renderer.font?.name,
          color: ref.renderer.color.toHEX(),
          size: ref.renderer.fontSize,
          lineHeight: ref.renderer.lineHeight,
          autoWrap: ref.renderer.enableWrapText,
        };
      },
      set(font: ITextStyle['font'], onlySpecified: boolean = true) {
        ref.setStyle({ font }, onlySpecified);
      },
    };
  })(this);

  /** 修饰 */
  public readonly decor: {
    get(): { bold: boolean; italic: boolean; underline: boolean };
    set(decor: ITextStyle['decor'], onlySpecified?: boolean): void;
  } = (function (ref: Text) {
    return {
      get() {
        return {
          bold: ref.renderer.isBold,
          italic: ref.renderer.isItalic,
          underline: ref.renderer.isUnderline,
        };
      },
      set(decor: ITextStyle['decor'], onlySpecified: boolean = true) {
        ref.setStyle({ decor }, onlySpecified);
      },
      unset() {
        ref.setStyle({ decor: { bold: false, italic: false, underline: false } });
      },
    };
  })(this);

  /** 描边 */
  public readonly outline: {
    get(): { enabled: boolean; width: number; color: string };
    set(outline: Partial<ITextStyle['outline']>, onlySpecified?: boolean): void;
    unset(): void;
  } = (function (ref: Text) {
    return {
      get() {
        return {
          enabled: ref.renderer.enableOutline,
          width: ref.renderer.outlineWidth,
          color: ref.renderer.outlineColor.toHEX(),
        };
      },
      set(outline: Partial<ITextStyle['outline']>, onlySpecified: boolean = true) {
        ref.setStyle({ outline }, onlySpecified);
      },
      unset() {
        ref.renderer.enableOutline = false;
      },
    };
  })(this);

  /** 阴影 */
  public readonly shadow: {
    get(): { enabled: boolean; blur: number; x: number; y: number; color: string };
    set(shadow: Partial<ITextStyle['shadow']>, onlySpecified?: boolean): void;
    unset(): void;
  } = (function (ref: Text) {
    return {
      get() {
        return {
          enabled: ref.renderer.enableShadow,
          blur: ref.renderer.shadowBlur,
          x: ref.renderer.shadowOffset.x,
          y: ref.renderer.shadowOffset.y,
          color: ref.renderer.shadowColor.toHEX(),
        };
      },
      set(shadow: Partial<ITextStyle['shadow']>, onlySpecified: boolean = true) {
        ref.setStyle({ shadow }, onlySpecified);
      },
      unset() {
        ref.renderer.enableShadow = false;
      },
    };
  })(this);

  /** 对齐 */
  public readonly alignment: {
    get(): { h: HorizontalTextAlignment; v: VerticalTextAlignment };
    set(alignment: ITextStyle['alignment'], onlySpecified?: boolean): void;
  } = (function (ref: Text) {
    return {
      get() {
        return {
          h: ref.renderer.horizontalAlign,
          v: ref.renderer.verticalAlign,
        };
      },
      set(alignment: ITextStyle['alignment'], onlySpecified: boolean = true) {
        ref.setStyle({ alignment }, onlySpecified);
      },
      quick(mode: 'cc' | 'lt' | 'lb' | 'lc' | 'rt' | 'rb' | 'rc') {
        const alignment: ITextStyle['alignment'] = {};

        switch (mode) {
          case 'cc':
            alignment.h = HorizontalTextAlignment.CENTER;
            alignment.v = VerticalTextAlignment.CENTER;
            break;
          case 'lt':
            alignment.h = HorizontalTextAlignment.LEFT;
            alignment.v = VerticalTextAlignment.TOP;
            break;
          case 'lb':
            alignment.h = HorizontalTextAlignment.LEFT;
            alignment.v = VerticalTextAlignment.BOTTOM;
            break;
          case 'lc':
            alignment.h = HorizontalTextAlignment.LEFT;
            alignment.v = VerticalTextAlignment.CENTER;
            break;
          case 'rt':
            alignment.h = HorizontalTextAlignment.RIGHT;
            alignment.v = VerticalTextAlignment.TOP;
            break;
          case 'rb':
            alignment.h = HorizontalTextAlignment.RIGHT;
            alignment.v = VerticalTextAlignment.BOTTOM;
            break;
          case 'rc':
            alignment.h = HorizontalTextAlignment.RIGHT;
            alignment.v = VerticalTextAlignment.CENTER;
            break;
        }

        ref.setStyle({ alignment });
      },
      unset() {
        this.quick('cc');
      },
    };
  })(this);

  /** 溢出 */
  public readonly overflow = (function (ref: Text) {
    return {
      get() {
        return ref.renderer.overflow;
      },
      set(overflow: Overflow) {
        ref.setStyle({ overflow });
      },
      unset() {
        ref.renderer.overflow = Overflow.NONE;
      },
    };
  })(this);

  /** 缓存 */
  public readonly cacheMode = (function (ref: Text) {
    return {
      get() {
        return ref.renderer.cacheMode;
      },
      set(cacheMode: CacheMode) {
        ref.setStyle({ cacheMode });
      },
      unset() {
        ref.renderer.cacheMode = CacheMode.NONE;
      },
    };
  })(this);

  /**
   * 强制更新渲染数据
   * @notes 用于异步加载字体后刷新显示，避免字体切换后文本不显示
   */
  flush() {
    this.renderer.updateRenderData(true);
  }

  protected didCreate(): void {
    this.node.acquire(Label);
  }
}
