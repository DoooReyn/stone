import { _decorator, EventTouch, Node } from 'cc';

import { Gem } from '../Gem';
import { RatioGroup } from './RatioGroup';

const { ccclass, menu, property } = _decorator;

/**
 * 单选组件
 */
@ccclass('Gem/Ratio')
@menu('Gem/Ratio')
export class Ratio extends Gem {
  // ------------------------------- 属性声明区 -------------------------------

  /** 单选容器 */
  @property({ displayName: '容器', type: RatioGroup })
  protected $group: RatioGroup;

  @property({ visible: false })
  protected $selected: boolean = false;

  /** 选中标记 */
  @property({ displayName: '选中标记', type: Node })
  protected $mark: Node = null!;

  /** 是否选中 */
  @property({ displayName: '选中否？' })
  get selected() {
    return this.$selected;
  }
  set selected(enabled: boolean) {
    if (this.$selected !== enabled) {
      this.$selected = enabled;
      this.flush();
    }
  }

  // ------------------------------- 公开访问区 -------------------------------

  flush() {
    if (this.$mark) {
      this.$mark.active = this.$selected;
    }
  }

  // ------------------------------- 受限访问区 -------------------------------

  protected didAwake(): void {
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.$group && this.$group.add(this);
    this.flush();
  }

  protected didSuspend(): void {
    this.$group && this.$group.remove(this);
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
  }

  protected onTouchEnd(evt: EventTouch) {
    const loc = evt.getLocation();
    const hit = this.node.uiTransform.hitTest(loc);
    if (hit && this.$group) {
      this.$group.flush(this);
    }
  }
}
