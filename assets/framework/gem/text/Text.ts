import { v2, _decorator, Label } from 'cc';
import { PRESET_EVENT_NAME } from 'fast/config/Event';
import { PRESET_GUI } from 'fast/config/Gui';
import { PRESET_TOKEN } from 'fast/config/Token';
import { fast } from 'fast/Fast';
import { IResLoaderPlugin } from 'fast/plugin/res/IResLoaderPlugin';
import { ITextAttr } from 'fast/Types';
import { be, color } from 'fast/util';
import { notUndefined } from 'fast/util/Be';

import { Gem } from '../Gem';

const { ccclass, menu, property, requireComponent } = _decorator;

/**
 * 文本组件
 * @notes 封装 cc.Label
 */
@ccclass('Text')
@menu('Gem/Text')
@requireComponent(Label)
export class Text extends Gem {
  // ------------------------------- 静态成员区 -------------------------------

  /**
   * 获取文本属性
   * @param text 标签组件
   * @param key 属性名称
   * @returns
   */
  public static GetTextAttr<S extends keyof ITextAttr>(text: Label, key: S): ITextAttr[S] {
    let attr = undefined;
    switch (key) {
      case 'text':
        attr = text.string;
        break;
      case 'family':
        attr = text.useSystemFont ? text.fontFamily : text.font?.name || '';
        break;
      case 'color':
        attr = text.color.toHEX();
        break;
      case 'size':
        attr = text.fontSize;
        break;
      case 'multiline':
        attr = text.enableWrapText;
        break;
      case 'bold':
        attr = text.isBold;
        break;
      case 'italic':
        attr = text.isItalic;
        break;
      case 'underline':
        attr = text.isUnderline;
        break;
      case 'outline':
        if (!text.enableOutline) {
          attr = { color: '', width: 0 };
        } else {
          attr = { color: text.outlineColor.toHEX(), width: text.outlineWidth };
        }
        break;
      case 'shadow':
        if (!text.enableShadow) {
          attr = { color: '', x: 0, y: 0, blur: 0 };
        } else {
          attr = {
            color: text.shadowColor.toHEX(),
            x: text.shadowOffset.x,
            y: text.shadowOffset.y,
            blur: text.shadowBlur,
          };
        }
        break;
      case 'alignHor':
        attr = text.horizontalAlign;
        break;
      case 'alignVer':
        attr = text.verticalAlign;
        break;
      case 'overflow':
        attr = text.overflow;
        break;
      case 'cacheMode':
        attr = text.cacheMode;
        break;
    }

    return attr as ITextAttr[S];
  }

  /**
   * 设置文本属性
   * @param text 标签组件
   * @param attr 文本属性
   */
  public static SetTextAttr(text: Label, attr: Partial<ITextAttr>) {
    if (be.notUndefined(attr.family)) {
      // 应用字体，支持系统字体和资源加载字体
      const family = attr.family!;
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

    if (be.notUndefined(attr.size)) {
      text.fontSize = attr.size!;
      text.lineHeight = text.fontSize * 1.5;
    }

    if (be.notUndefined(attr.multiline)) {
      // 自动行高
      text.enableWrapText = true;
      text.lineHeight = text.fontSize * 1.5;
    }

    if (be.notUndefined(attr.color)) {
      text.color = color.from(attr.color!);
    }

    if (be.notUndefined(attr.bold)) {
      text.isBold = attr.bold!;
    }

    if (be.notUndefined(attr.italic)) {
      text.isItalic = attr.italic!;
    }

    if (be.notUndefined(attr.underline)) {
      text.isUnderline = attr.underline!;
    }

    if (be.notUndefined(attr.outline)) {
      text.enableOutline = true;
      text.outlineWidth = attr.outline!.width;
      text.outlineColor = color.from(attr.outline!.color);
    }

    if (be.notUndefined(attr.shadow)) {
      text.enableShadow = true;
      text.shadowBlur = attr.shadow!.blur;
      text.shadowColor = color.from(attr.shadow!.color);
      text.shadowOffset = v2(attr.shadow!.x, attr.shadow!.y);
    }

    if (be.notUndefined(attr.alignHor)) {
      text.horizontalAlign = attr.alignHor!;
    }

    if (be.notUndefined(attr.alignVer)) {
      text.verticalAlign = attr.alignVer!;
    }

    if (be.notUndefined(attr.overflow)) {
      text.overflow = attr.overflow!;
    }

    if (be.notUndefined(attr.cacheMode)) {
      text.cacheMode = attr.cacheMode!;
    }
  }

  // ------------------------------- 属性声明区 -------------------------------

  /** 用户字体 */
  @property({ displayName: '字体', tooltip: '置空时使用内置资源' })
  protected $font: string = '';

  /** 标签组件 */
  protected $text: Label;

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
  get<S extends keyof ITextAttr>(key: S): ITextAttr[S] {
    return Text.GetTextAttr(this.$text, key) as ITextAttr[S];
  }

  /**
   * 设置文本属性
   * @param key 属性名称
   */
  set(key: Partial<ITextAttr>) {
    Text.SetTextAttr(this.$text, key);
  }

  /**
   * 强制更新渲染数据
   * @notes 用于异步加载字体后刷新显示，避免字体切换后文本不显示
   */
  flush() {
    this.$text.updateRenderData(true);
  }

  // ------------------------------- 受限访问区 -------------------------------

  protected didCreate(): void {
    this.$font ||= PRESET_GUI.TEXT_FONT.family;
    this.$text = this.node.acquire(Label)!;
  }

  protected didAwake(): void {
    this.$text.node.on(PRESET_EVENT_NAME.FONT_CHANGED, this.onFontChanged, this);
  }

  protected didSuspend(): void {
    this.$text.node.off(PRESET_EVENT_NAME.FONT_CHANGED, this.onFontChanged, this);
  }

  protected didLaunch(): void {
    this.set({ family: this.$font });
  }

  protected onFontChanged(family: string) {
    this.$font = family;
  }
}
