import { _decorator, Label } from 'cc';
import { PRESET_GUI } from 'fast/config/Gui';
import { ITextStyle } from 'fast/Types';
import { misc } from 'fast/util';

import { Gem } from '../Gem';

const { ccclass, menu, property, requireComponent } = _decorator;

/**
 * 文本组件，封装 Label
 */
@ccclass('Text')
@menu('Gem/Text')
@requireComponent(Label)
export class Text extends Gem {
  /** 用户字体 */
  @property({ displayName: '字体', tooltip: '置空时使用内置资源' })
  protected $font: string = '';

  /** 标签组件 */
  protected $text: Label;

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
   * 获取文本样式
   * @param style 样式
   * @returns
   */
  get<S extends keyof ITextStyle>(style: S): ITextStyle[S] {
    return misc.getTextStyle(this.$text, style) as ITextStyle[S];
  }

  /**
   * 批量获取文本样式
   * @param styles 样式
   * @returns
   */
  gets<S extends keyof ITextStyle>(...styles: S[]) {
    return misc.getTextStyleBatch(this.$text, ...styles);
  }

  /**
   * 设置文本样式
   */
  set(style: Partial<ITextStyle>) {
    misc.setTextStyle(this.$text, style);
  }

  /**
   * 强制更新渲染数据
   * @notes 用于异步加载字体后刷新显示，避免字体切换后文本不显示
   */
  flush() {
    this.$text.updateRenderData(true);
  }

  protected didCreate(): void {
    this.$font ||= PRESET_GUI.TEXT_FONT.family;
    this.$text = this.node.acquire(Label)!;
  }

  protected didAwake(): void {
    this.$text.node.on('font-changed', this.onFontChanged, this);
  }

  protected didSuspend(): void {
    this.$text.node.off('font-changed', this.onFontChanged, this);
  }

  protected didLaunch(): void {
    this.set({ family: this.$font });
  }

  protected onFontChanged(family: string) {
    this.$font = family;
  }
}
