import { _decorator, EventTouch, Node } from 'cc';

import { Gem } from '../Gem';
import { CheckableGroup } from './CheckableGroup';

const { ccclass, menu, property } = _decorator;

/**
 * 复选组件
 */
@ccclass('Gem/Checkable')
@menu('Gem/Checkable')
export class Checkable extends Gem {
  // ------------------------------- 属性声明区 -------------------------------

  /** 脏标记 */
  private _dirty: boolean = false;

  /** 复选容器 */
  @property({ displayName: '容器', type: CheckableGroup })
  protected $group: CheckableGroup;

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
      this._dirty = true;
      this.$checked = enabled;
    }
  }

  // ------------------------------- 受限访问区 -------------------------------

  protected didAwake(): void {
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.$group && this.$group.add(this);
    this._dirty = true;
  }

  protected didSuspend(): void {
    this.$group && this.$group.remove(this);
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
  }

  protected onTouchEnd(evt: EventTouch) {
    const loc = evt.getLocation();
    const hit = this.node.uiTransform.hitTest(loc);
    if (hit) {
      this.checked = !this.$checked;
    }
  }

  protected flush() {
    if (this.$mark) {
      this.$mark.active = this.$checked;
    }

    if (this.$group) {
      this.$group.flush(this);
    }
  }

  protected didTick(): void {
    if (this._dirty) {
      this._dirty = false;
      this.flush();
    }
  }
}
