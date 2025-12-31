import { _decorator, Node, RichText } from 'cc';
import { PRESET_EVENT_NAME } from 'fast/config/Event';
import { PRESET_GUI } from 'fast/config/Gui';
import { PRESET_TOKEN } from 'fast/config/Token';
import { fast } from 'fast/Fast';
import { IResLoaderPlugin } from 'fast/plugin/res/IResLoaderPlugin';
import { ITextRichAttr } from 'fast/Types';
import { be, color, digit } from 'fast/util';

import { Gem } from '../Gem';

const { ccclass, requireComponent, menu, property } = _decorator;

/**
 * 富文本组件
 * @notes 包装 cc.RichText
 */
@ccclass('Gem/TextRich')
@menu('Gem/TextRich')
@requireComponent(RichText)
export class TextRich extends Gem {
  // ------------------------------- 静态成员区 -------------------------------

  /**
   * 获取富文本属性
   * @param text 富文本组件
   * @param key 富文本属性名称
   * @returns 富文本属性值
   */
  public static GetTextRichAttr<S extends keyof ITextRichAttr>(text: RichText, key: S) {
    let attr = undefined;

    switch (key) {
      case 'alignHor':
        attr = text.horizontalAlign;
        break;
      case 'alignVer':
        attr = text.verticalAlign;
        break;
      case 'atlas':
        attr = text.imageAtlas;
        break;
      case 'cacheMode':
        attr = text.cacheMode;
        break;
      case 'color':
        attr = text.fontColor.toHEX();
        break;
      case 'family':
        attr = text.useSystemFont ? text.fontFamily : text.font?.name || PRESET_GUI.TEXT_FONT.family;
        break;
      case 'lineHeight':
        attr = text.verticalAlign;
        break;
      case 'maxWidth':
        attr = text.maxWidth;
        break;
      case 'size':
        attr = text.fontSize;
        break;
      case 'text':
        attr = text.string;
        break;
      case 'preventTouch':
        attr = text.handleTouchEvent;
        break;
    }

    return attr as ITextRichAttr[S];
  }

  /**
   * 设置富文本属性
   * @param text 富文本组件
   * @param attrs 富文本属性
   */
  public static SetTextRichAttr(text: RichText, attrs: Partial<ITextRichAttr>) {
    if (be.notUndefined(attrs.family)) {
      // 应用字体，支持系统字体和资源加载字体
      const family = attrs.family!;
      if (family.startsWith('l:')) {
        const loader = fast.acquire<IResLoaderPlugin>(PRESET_TOKEN.RES_LOADER);
        loader.loadFont(family).then((font) => {
          if (font) {
            text.useSystemFont = false;
            text.font = font;
            text.node.emit(PRESET_EVENT_NAME.FONT_CHANGED, family);
          } else {
            text.useSystemFont = true;
            text.node.emit(PRESET_EVENT_NAME.FONT_CHANGED, text.fontFamily);
          }
        });
      } else {
        text.useSystemFont = true;
        text.fontFamily = family;
        text.node.emit(PRESET_EVENT_NAME.FONT_CHANGED, text.fontFamily);
      }
    }
    if (be.notUndefined(attrs.size)) {
      text.fontSize = attrs.size;
    }
    if (be.notUndefined(attrs.color)) {
      text.fontColor = color.from(attrs.color);
    }
    if (be.notUndefined(attrs.lineHeight)) {
      text.lineHeight = attrs.lineHeight;
    }
    if (be.notUndefined(attrs.alignHor)) {
      text.horizontalAlign = attrs.alignHor;
    }
    if (be.notUndefined(attrs.alignVer)) {
      text.verticalAlign = attrs.alignVer;
    }
    if (be.notUndefined(attrs.maxWidth)) {
      text.maxWidth = attrs.maxWidth;
    }
    if (be.notUndefined(attrs.atlas)) {
      text.imageAtlas = attrs.atlas;
    }
    if (be.notUndefined(attrs.preventTouch)) {
      text.handleTouchEvent = attrs.preventTouch;
    }
    if (be.notUndefined(attrs.text)) {
      text.string = attrs.text;
    }
  }

  // ------------------------------- 属性声明区 -------------------------------

  /** 用户字体 */
  @property({ displayName: '字体', tooltip: '置空时使用内置资源' })
  protected $font: string = '';

  /** 标签组件 */
  protected $text: RichText;

  // ------------------------------- 公开访问区 -------------------------------

  /** 文本内容 */
  get text() {
    return this.$text.string;
  }
  set text(text: string) {
    this.$text.string = text;
  }

  /** 字体 */
  get font() {
    return this.$font;
  }

  /**
   * 获取文本属性
   * @param key 属性名称
   * @returns
   */
  get<S extends keyof ITextRichAttr>(key: S): ITextRichAttr[S] {
    return TextRich.GetTextRichAttr(this.$text, key) as ITextRichAttr[S];
  }

  /**
   * 设置文本属性
   * @param key 属性名称
   */
  set(key: Partial<ITextRichAttr>) {
    TextRich.SetTextRichAttr(this.$text, key);
  }

  /**
   * 遍历富文本节点
   * @param visit 访问方法
   */
  each(visit: (node: Node, index: number) => void) {
    // @ts-ignore
    const segments = this.$text._segments;
    segments.forEach((seg, index) => {
      visit(seg.node, index);
    });
  }

  /**
   * 获取索引所在的节点
   * @param index 索引
   * @returns 富文本节点
   */
  elementAt(index: number) {
    // @ts-ignore
    const segments = this.$text._segments;
    index = digit.clamp(index, 0, segments.length - 1);
    return segments[index];
  }

  /** 富文本节点数量 */
  get elementCount() {
    // @ts-ignore
    return this.$text._segments.length;
  }

  // ------------------------------- 受限访问区 -------------------------------

  protected didCreate(): void {
    this.$font ||= PRESET_GUI.TEXT_FONT.family;
    this.$text = this.getComponent(RichText)!;
  }

  protected didAwake(): void {
    this.node.on(PRESET_EVENT_NAME.FONT_CHANGED, this.onFontChanged, this);
  }

  protected didSuspend(): void {
    this.node.off(PRESET_EVENT_NAME.FONT_CHANGED, this.onFontChanged, this);
  }

  protected didLaunch(): void {
    this.set({ family: this.$font });
  }

  protected onFontChanged(family: string) {
    this.$font = family;
  }
}
