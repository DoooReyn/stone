import { _decorator, EventTouch, Node } from 'cc';

import { Gem } from '../Gem';
import { CheckBoxGroup } from './CheckBoxGroup';

const { ccclass, menu, property } = _decorator;

/**
 * 复选组件
 */
@ccclass('Gem/CheckBox')
@menu('Gem/CheckBox')
export class CheckBox extends Gem {
  // ------------------------------- 属性声明区 -------------------------------

  /** 复选容器 */
  @property({ displayName: '容器', type: CheckBoxGroup })
  protected $group: CheckBoxGroup;

  /** 选中标记 */
  @property({ displayName: '选中标记', type: Node })
  protected $mark: Node = null!;

  /** 是否选中 */
  @property({ visible: false })
  protected $checked: boolean = false;

  /** 是否选中 */
  @property({ displayName: '选中否？' })
  get checked() {
    return this.$checked;
  }
  set checked(enabled: boolean) {
    if (this.$checked !== enabled) {
      this.$checked = enabled;
      this.flush();
    }
  }

  // ------------------------------- 公开访问区 -------------------------------

  public flush() {
    if (this.$mark) {
      this.$mark.active = this.$checked;
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
