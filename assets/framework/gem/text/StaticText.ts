import { v2, _decorator, Label } from 'cc';
import { PRESET_GUI } from 'fast/config/Gui';
import { PRESET_TOKEN } from 'fast/config/Token';
import { fast } from 'fast/Fast';
import { IResLoaderPlugin } from 'fast/plugin/res/IResLoaderPlugin';
import { be, color } from 'fast/util';

import { Gem } from '../Gem';

const { ccclass, menu, property, requireComponent } = _decorator;

export interface ITextStyle {
  font: Partial<{ family: string; size: number; color: string }>;
  decor: Partial<{ bold: boolean; italic: boolean; underline: boolean }>;
  outline: Partial<{ color: string; width: number }>;
  shadow: Partial<{ color: string; x: number; y: number; blur: number }>;
}

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

  setStyle(style: Partial<ITextStyle>, checkExists: boolean = true) {
    // 应用字体
    const font = { ...PRESET_GUI.TEXT_FONT, ...style.font };
    if (checkExists ? be.notUndefined(style.font?.family) : true) this.applyFontFamily(font.family);
    if (checkExists ? be.notUndefined(style.font?.size) : true) this.label.fontSize = font.size;
    if (checkExists ? be.notUndefined(style.font?.color) : true) this.label.color = color.from(font.color);

    // 应用修饰
    const decor = { ...PRESET_GUI.TEXT_DECOR, ...style.decor };
    if (checkExists ? be.notUndefined(style.decor?.bold) : true) this.label.isBold = decor.bold;
    if (checkExists ? be.notUndefined(style.decor?.italic) : true) this.label.isItalic = decor.italic;
    if (checkExists ? be.notUndefined(style.decor?.underline) : true) this.label.isUnderline = decor.underline;

    // 应用描边
    if (style.outline) {
      if (checkExists ? be.notUndefined(style.outline.width) : true) {
        const outline = { ...PRESET_GUI.TEXT_OUTLINE, ...style.outline };
        if (outline.width > 0) {
          this.label.enableOutline = true;
          this.label.outlineWidth = outline.width;
          if (checkExists ? be.notUndefined(style.outline.color) : true) {
            this.label.outlineColor = color.from(outline.color);
          }
        } else {
          this.label.enableOutline = false;
        }
      }
    } else {
      this.label.enableOutline = false;
    }

    // 应用阴影
    if (style.shadow) {
      if (checkExists ? be.notUndefined(style.shadow.blur) : true) {
        const shadow = { ...PRESET_GUI.TEXT_SHADOW, ...style.shadow };
        if (shadow.blur > 0) {
          this.label.enableShadow = true;
          this.label.shadowBlur = shadow.blur;
          if (checkExists ? be.notUndefined(style.shadow.color) : true) {
            this.label.shadowColor = color.from(shadow.color);
          }
          if (checkExists ? be.notUndefined(style.shadow.x) && be.notUndefined(style.shadow.y) : true) {
            this.label.shadowOffset = v2(shadow.x, shadow.y);
          }
        } else {
          this.label.enableShadow = false;
        }
      }
    } else {
      this.label.enableShadow = false;
    }
  }

  flush() {
    this.label.updateRenderData(true);
  }

  protected didCreate(): void {
    this.node.acquire(Label);
  }
}
