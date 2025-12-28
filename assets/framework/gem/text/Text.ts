import { v2, _decorator, Label } from 'cc';
import { PRESET_TOKEN } from 'fast/config/Token';
import { fast } from 'fast/Fast';
import { IResLoaderPlugin } from 'fast/plugin/res/IResLoaderPlugin';
import { Dict, ITextStyle } from 'fast/Types';
import { be, color } from 'fast/util';

import { Gem } from '../Gem';

const { ccclass, menu, requireComponent } = _decorator;

/**
 * 文本组件，封装 Label
 */
@ccclass('Text')
@menu('Gem/Text')
@requireComponent(Label)
export class Text extends Gem {
  /** 用户字体 */
  private userFont: string = '';

  /** 标签组件 */
  protected get $text() {
    return this.getComponent(Label)!;
  }

  /** 文本内容 */
  get text() {
    return this.$text.string;
  }
  set text(text: string) {
    this.$text.string = text;
  }

  /**
   * 获取文本样式
   * @param style 样式
   * @returns
   */
  get<S extends keyof ITextStyle>(style: S): ITextStyle[S] {
    const txt = this.$text;
    let attr = undefined;
    switch (style) {
      case 'text':
        attr = txt.string;
        break;
      case 'family':
        attr = txt.useSystemFont ? txt.fontFamily : this.userFont || '';
        break;
      case 'color':
        attr = txt.color.toHEX();
        break;
      case 'size':
        attr = txt.fontSize;
        break;
      case 'multiline':
        attr = txt.enableWrapText;
        break;
      case 'bold':
        attr = txt.isBold;
        break;
      case 'italic':
        attr = txt.isItalic;
        break;
      case 'underline':
        attr = txt.isUnderline;
        break;
      case 'outline':
        if (!txt.enableOutline) {
          attr = { color: '', width: 0 };
        } else {
          attr = { color: txt.outlineColor.toHEX(), width: txt.outlineWidth };
        }
        break;
      case 'shadow':
        if (!txt.enableShadow) {
          attr = { color: '', x: 0, y: 0, blur: 0 };
        } else {
          attr = {
            color: txt.shadowColor.toHEX(),
            x: txt.shadowOffset.x,
            y: txt.shadowOffset.y,
            blur: txt.shadowBlur,
          };
        }
        break;
      case 'alignHor':
        attr = txt.horizontalAlign;
        break;
      case 'alignVer':
        attr = txt.verticalAlign;
        break;
      case 'overflow':
        attr = txt.overflow;
        break;
      case 'cacheMode':
        attr = txt.cacheMode;
        break;
    }

    return attr as ITextStyle[S];
  }

  /**
   * 批量获取文本样式
   * @param styles 样式
   * @returns
   */
  gets<S extends keyof ITextStyle>(...styles: S[]) {
    const attrs: Dict = {};
    styles.forEach((k) => {
      attrs[k] = this.get(k);
    });
    return attrs;
  }

  /**
   * 设置文本样式
   */
  set(style: Partial<ITextStyle>) {
    if (be.notUndefined(style.text)) {
      this.$text.string = style.text!;
    }

    if (be.notUndefined(style.family)) {
      // 应用字体，支持系统字体和资源加载字体
      const family = style.family!;
      if (family.startsWith('l:')) {
        const loader = fast.acquire<IResLoaderPlugin>(PRESET_TOKEN.RES_LOADER);
        loader.loadFont(family).then((font) => {
          if (font) {
            this.$text.useSystemFont = false;
            this.$text.font = font;
            this.userFont = family;
          } else {
            this.$text.useSystemFont = true;
            this.userFont = this.$text.fontFamily;
          }
        });
      } else {
        this.$text.useSystemFont = true;
        this.$text.fontFamily = family;
        this.userFont = this.$text.fontFamily;
      }
    }

    if (be.notUndefined(style.size)) {
      this.$text.fontSize = style.size!;
      this.$text.lineHeight = this.$text.fontSize * 1.5;
    }

    if (be.notUndefined(style.multiline)) {
      // 自动行高
      this.$text.enableWrapText = true;
      this.$text.lineHeight = this.$text.fontSize * 1.5;
    }

    if (be.notUndefined(style.color)) {
      this.$text.color = color.from(style.color!);
    }

    if (be.notUndefined(style.bold)) {
      this.$text.isBold = style.bold!;
    }

    if (be.notUndefined(style.italic)) {
      this.$text.isItalic = style.italic!;
    }

    if (be.notUndefined(style.underline)) {
      this.$text.isUnderline = style.underline!;
    }

    if (be.notUndefined(style.outline)) {
      this.$text.enableOutline = true;
      this.$text.outlineWidth = style.outline!.width;
      this.$text.outlineColor = color.from(style.outline!.color);
    }

    if (be.notUndefined(style.shadow)) {
      this.$text.enableShadow = true;
      this.$text.shadowBlur = style.shadow!.blur;
      this.$text.shadowColor = color.from(style.shadow!.color);
      this.$text.shadowOffset = v2(style.shadow!.x, style.shadow!.y);
    }

    if (be.notUndefined(style.alignHor)) {
      this.$text.horizontalAlign = style.alignHor!;
    }

    if (be.notUndefined(style.alignVer)) {
      this.$text.verticalAlign = style.alignVer!;
    }

    if (be.notUndefined(style.overflow)) {
      this.$text.overflow = style.overflow!;
    }

    if (be.notUndefined(style.cacheMode)) {
      this.$text.cacheMode = style.cacheMode!;
    }
  }

  /**
   * 强制更新渲染数据
   * @notes 用于异步加载字体后刷新显示，避免字体切换后文本不显示
   */
  flush() {
    this.$text.updateRenderData(true);
  }

  protected didCreate(): void {
    this.node.acquire(Label);
  }
}
