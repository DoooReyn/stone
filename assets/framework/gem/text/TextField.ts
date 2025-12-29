import { _decorator, CCInteger, EditBox, Overflow, VerticalTextAlignment } from 'cc';
import { PRESET_EVENT_NAME } from 'fast/config/Event';
import { PRESET_GUI } from 'fast/config/Gui';
import { ITextStyle } from 'fast/Types';
import { misc } from 'fast/util';

import { Gem } from '../Gem';

const { ccclass, property, menu, requireComponent } = _decorator;

@ccclass('TextField')
@menu('Gem/TextField')
@requireComponent(EditBox)
export class TextField extends Gem {
  /** 左边距 */
  @property({ displayName: '左边距', type: CCInteger, min: 0, step: 1 })
  protected $padding: number = 2;

  /** 占位字体 */
  @property({ displayName: '占位字体', tooltip: '置空时使用内置资源' })
  protected $phdFont: string = '';

  /** 内容字体 */
  @property({ displayName: '内容字体', tooltip: '置空时使用内置资源' })
  protected $txtFont: string = '';

  /** 左边距 */
  get padding() {
    return this.$padding;
  }
  set padding(p: number) {
    if (this.$padding != p) {
      this.$padding = p;
      this.updateView();
    }
  }

  /**
   * 设置占位样式
   * @param style 样式
   */
  setPhdStyle(style: Partial<ITextStyle>) {
    const text = this.$editBox.placeholderLabel;
    if (text) {
      misc.setTextStyle(text, style);
      if (style.text) {
        this.$editBox.placeholder = style.text;
      }
    }
  }

  /**
   * 设置内容样式
   * @param style 样式
   */
  setTxtStyle(style: Partial<ITextStyle>) {
    const text = this.$editBox.textLabel;
    if (text) {
      misc.setTextStyle(text, style);
      if (style.text) {
        this.$editBox.string = style.text;
      }
    }
  }

  /** 内容字体 */
  get txtFont() {
    return this.$txtFont;
  }

  /** 占位字体 */
  get phdFont() {
    return this.$phdFont;
  }

  /** 输入框组件 */
  protected $editBox: EditBox;

  protected didCreate(): void {
    this.$editBox = this.getComponent(EditBox)!;
  }

  protected didLaunch(): void {
    this.updateView();
  }

  protected didAwake(): void {
    const { textLabel: txt, placeholderLabel: phd } = this.$editBox;
    if (txt) {
      txt.node.on(PRESET_EVENT_NAME.FONT_CHANGED, this.onTxtFontChanged, this);
    }
    if (phd) {
      phd.node.on(PRESET_EVENT_NAME.FONT_CHANGED, this.onPhdFontChanged, this);
    }
  }

  /** 内容字体变化回调 */
  protected onTxtFontChanged(family: string) {
    this.$txtFont = family;
  }

  /** 占位字体变化回调 */
  protected onPhdFontChanged(family: string) {
    this.$phdFont = family;
  }

  /** 更新视图 */
  protected updateView() {
    this.$phdFont ||= PRESET_GUI.TEXT_FONT.family;
    this.$txtFont ||= PRESET_GUI.TEXT_FONT.family;

    const { textLabel: txt, placeholderLabel: phd } = this.$editBox;
    const startX = -this.node.w / 2;

    if (txt) {
      this.setTxtStyle({ family: this.$txtFont, overflow: Overflow.SHRINK, multiline: false });
      txt.node.x = startX + this.$padding;
      txt.verticalAlign = VerticalTextAlignment.CENTER;
    }

    if (phd) {
      this.setPhdStyle({ family: this.$phdFont, overflow: Overflow.SHRINK, multiline: false });
      phd.node.x = startX + this.$padding;
      phd.verticalAlign = VerticalTextAlignment.CENTER;
    }
  }
}
