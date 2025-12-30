import { _decorator, CCInteger, EditBox, Overflow, VerticalTextAlignment } from 'cc';
import { PRESET_EVENT_NAME } from 'fast/config/Event';
import { PRESET_GUI } from 'fast/config/Gui';
import { ITextAttr, ITextFieldAttr } from 'fast/Types';
import { be } from 'fast/util';

import { Gem } from '../Gem';
import { Text } from './Text';

const { ccclass, property, menu, requireComponent } = _decorator;

/**
 * 输入框组件
 * @notes 封装 cc.EditBox
 */
@ccclass('TextField')
@menu('Gem/TextField')
@requireComponent(EditBox)
export class TextField extends Gem {
  // ------------------------------- 静态成员区 -------------------------------

  /**
   * 获取输入框属性
   * @param field 输入框组件
   * @param key 属性名称
   * @returns 输入框属性
   */
  public static GetTextFieldAttr<S extends keyof ITextFieldAttr>(field: EditBox, key: S) {
    let attr = undefined;
    switch (key) {
      case 'text':
        attr = field.string;
        break;
      case 'tip':
        attr = field.placeholder;
        break;
      case 'inputMode':
        attr = field.inputMode;
        break;
      case 'inputFlag':
        attr = field.inputFlag;
        break;
      case 'returnMode':
        attr = field.returnType;
        break;
      case 'maxLength':
        attr = field.maxLength;
        break;
    }
    return attr as ITextFieldAttr[S];
  }

  /**
   * 设置输入框属性
   * @param field 输入框组件
   * @param attrs 输入框属性
   */
  public static SetTextFieldAttr(field: EditBox, attrs: Partial<ITextFieldAttr>) {
    if (be.notUndefined(attrs.text)) {
      field.string = attrs.text;
    }
    if (be.notUndefined(attrs.tip)) {
      field.placeholder = attrs.tip;
    }
    if (be.notUndefined(attrs.inputMode)) {
      field.inputMode = attrs.inputMode;
    }
    if (be.notUndefined(attrs.inputFlag)) {
      field.inputFlag = attrs.inputFlag;
    }
    if (be.notUndefined(attrs.returnMode)) {
      field.returnType = attrs.returnMode;
    }
    if (be.notUndefined(attrs.maxLength)) {
      field.maxLength = attrs.maxLength;
    }
  }

  // ------------------------------- 属性声明区 -------------------------------

  /** 左边距 */
  @property({ displayName: '左边距', type: CCInteger, min: 0, step: 1 })
  protected $padding: number = 2;

  /** 占位字体 */
  @property({ displayName: '占位字体', tooltip: '置空时使用内置资源' })
  protected $phdFont: string = '';

  /** 内容字体 */
  @property({ displayName: '内容字体', tooltip: '置空时使用内置资源' })
  protected $txtFont: string = '';

  /** 输入框组件 */
  protected $editBox: EditBox;

  // ------------------------------- 公开访问区 -------------------------------

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
   * 设置占位属性
   * @param attrs 属性
   */
  setPhdAttr(attrs: Partial<ITextAttr>) {
    const text = this.$editBox.placeholderLabel;
    if (text) {
      Text.SetTextAttr(text, attrs);
      if (attrs.text) {
        this.$editBox.placeholder = attrs.text;
      }
    }
  }

  /**
   * 设置内容属性
   * @param attrs 属性
   */
  setTxtAttr(attrs: Partial<ITextAttr>) {
    const text = this.$editBox.textLabel;
    if (text) {
      Text.SetTextAttr(text, attrs);
      if (attrs.text) {
        this.$editBox.string = attrs.text;
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

  /**
   * 获取输入框属性
   * @param key 属性名称
   * @returns 输入框属性
   */
  get<S extends keyof ITextFieldAttr>(key: S) {
    return TextField.GetTextFieldAttr(this.$editBox, key);
  }

  /**
   * 设置输入框属性
   * @param attrs 输入框属性
   */
  set(attrs: Partial<ITextFieldAttr>) {
    TextField.SetTextFieldAttr(this.$editBox, attrs);
  }

  // ------------------------------- 受限访问区 -------------------------------

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
      this.setTxtAttr({ family: this.$txtFont, overflow: Overflow.SHRINK, multiline: false });
      txt.node.x = startX + this.$padding;
      txt.verticalAlign = VerticalTextAlignment.CENTER;
    }

    if (phd) {
      this.setPhdAttr({ family: this.$phdFont, overflow: Overflow.SHRINK, multiline: false });
      phd.node.x = startX + this.$padding;
      phd.verticalAlign = VerticalTextAlignment.CENTER;
    }
  }
}
