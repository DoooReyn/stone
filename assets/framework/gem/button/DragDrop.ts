import { _decorator, Enum, EventTouch, Node, Vec2, Vec3 } from 'cc';
import { PRESET_EVENT_NAME } from 'fast/config/Event';
import { PRESET_TOKEN } from 'fast/config/Token';
import { FastError } from 'fast/foundation/Error';

import { Gem } from '../Gem';

const { ccclass, menu, property } = _decorator;

/**
 * 拖放模式
 */
enum DragDropMode {
  /** 自由拖拽 */
  Free,
  /** 匹配拖拽（置放在目标中） */
  Target,
}

/**
 * 拖放组件
 */
@ccclass('Gem/DragDrop')
@menu('Gem/DragDrop')
export class DragDrop extends Gem {
  // ------------------------------- 属性声明区 -------------------------------

  /** 拖放模式 */
  @property({ displayName: '拖放模式', type: Enum(DragDropMode) })
  protected $mode: DragDropMode = DragDropMode.Free;

  /** 置放阈值 */
  @property({
    displayName: '置放阈值',
    tooltip: '拖放节点和目标节点的中心距离小于此阈值时即可认定可以置放',
    step: 1,
    min: 0,
    visible() {
      return this.mode == DragDropMode.Target;
    },
  })
  protected $thredshold: number = 0;

  /** 目标节点 */
  @property({ displayName: '置放节点', type: Node })
  protected $targetNode: Node = null!;

  /** 拖拽信息 */
  protected $information: {
    dragging: boolean;
    mode: DragDropMode;
    startLoc: Vec3;
    parent: Node;
    droppable: boolean;
  } = null!;

  /** 开始拖拽位置 2维 */
  private _startLoc2: Vec2 = new Vec2();
  /** 开始拖拽位置 3维 */
  private _startLoc3: Vec3 = new Vec3();
  /** 当前拖拽位置 2维 */
  private _dragLoc2: Vec2 = new Vec2();
  /** 当前拖拽位置 3维 */
  private _dragLoc3: Vec3 = new Vec3();

  // ------------------------------- 公开访问区 -------------------------------

  /** 拖放模式 */
  public get mode() {
    return this.$mode;
  }
  public set mode(value: DragDropMode) {
    if (!this.$information) this.$mode = value;
  }

  /** 置放阈值 */
  public get threshold() {
    return this.$thredshold;
  }
  public set threshold(value: number) {
    if (!this.$information) this.$thredshold = Math.max(0, value);
  }

  /** 目标节点 */
  public get targetNode() {
    return this.$targetNode;
  }
  public set targetNode(value: Node) {
    this.$targetNode = value;
  }

  // ------------------------------- 受限访问区 -------------------------------

  protected didAwake(): void {
    this.node.on(Node.EventType.TOUCH_START, this.onDragStart, this);
    this.node.on(Node.EventType.TOUCH_MOVE, this.onDragging, this);
    this.node.on(Node.EventType.TOUCH_CANCEL, this.onDragCancel, this);
    this.node.on(Node.EventType.TOUCH_END, this.onDragEnd, this);
  }

  protected didSuspend(): void {
    this.node.off(Node.EventType.TOUCH_START, this.onDragStart, this);
    this.node.off(Node.EventType.TOUCH_MOVE, this.onDragging, this);
    this.node.off(Node.EventType.TOUCH_CANCEL, this.onDragCancel, this);
    this.node.off(Node.EventType.TOUCH_END, this.onDragEnd, this);
  }

  /**
   * 拖拽开始事件回调
   * @param evt 触摸事件
   * @returns
   */
  protected onDragStart(evt: EventTouch) {
    if (this.$information?.dragging) {
      return;
    }

    if (this.$mode === DragDropMode.Target && !this.$targetNode) {
      throw new FastError(PRESET_TOKEN.GUI, '未设置置放节点');
    }

    const startWorldPos = this.node.getWorldPosition();
    evt.getUIStartLocation(this._startLoc2);
    this._startLoc3.set(this._startLoc2.x, this._startLoc2.y);
    const parentPrev = this.node.parent!;

    this.$information = {
      dragging: true,
      mode: this.$mode,
      startLoc: startWorldPos,
      parent: parentPrev,
      droppable: false,
    };

    if (this.$mode === DragDropMode.Target) {
      if (this.$thredshold === 0) {
        this.$thredshold = this.$targetNode.w / 2;
      }
      this.$targetNode.parent?.insertChild(this.node, this.$targetNode.getSiblingIndex() + 1);
      this.node.setWorldPosition(this._startLoc3);
    }

    this.node.emit(PRESET_EVENT_NAME.DRAG_START);
  }

  /**
   * 拖拽中事件回调
   * @param evt 触摸事件
   * @returns
   */
  protected onDragging(evt: EventTouch) {
    if (!this.$information?.dragging) {
      return;
    }

    evt.getUILocation(this._dragLoc2);
    this._dragLoc3.set(this._dragLoc2.x, this._dragLoc2.y);
    this.node.setWorldPosition(this._dragLoc3);
    this.node.emit(PRESET_EVENT_NAME.DRAGING);

    if (this.$mode === DragDropMode.Target) {
      const dragPos = this.node.getWorldPosition();
      const targetPos = this.$targetNode.getWorldPosition();
      const distance = Vec3.distance(dragPos, targetPos);
      if (distance <= this.$thredshold) {
        if (!this.$information.droppable) {
          this.$information.droppable = true;
          this.node.emit(PRESET_EVENT_NAME.DRAG_ENTER);
        }
      } else {
        if (this.$information.droppable) {
          this.$information.droppable = false;
          this.node.emit(PRESET_EVENT_NAME.DRAG_EXIT);
        }
      }
    }
  }

  /**
   * 拖拽取消事件回调
   * @param evt 触摸事件
   * @returns
   */
  protected onDragCancel(evt: EventTouch) {
    if (!this.$information?.dragging) {
      return;
    }

    this.$information.dragging = false;
    this.node.setWorldPosition(this.$information.startLoc);

    if (this.$mode === DragDropMode.Target) {
      this.node.setParent(this.$information.parent);
    }

    this.$information = null!;
    this.node.emit(PRESET_EVENT_NAME.DRAG_CANCEL);
  }

  /**
   * 拖拽结束事件回调
   * @param evt 触摸事件
   * @returns
   */
  protected onDragEnd(evt: EventTouch) {
    if (!this.$information?.dragging) {
      return;
    }

    if (this.$information.mode === DragDropMode.Target) {
      const dragPos = this.node.getWorldPosition();
      const targetPos = this.$targetNode.getWorldPosition();
      const distance = Vec3.distance(dragPos, targetPos);
      const data = { from: dragPos.clone(), to: targetPos.clone() };

      if (distance <= this.$thredshold) {
        this.node.setParent(this.$targetNode);
        this.node.setWorldPosition(targetPos);
        this.node.emit(PRESET_EVENT_NAME.DRAG_DROP_INSIDE, data);
      } else {
        this.node.setParent(this.$information.parent);
        this.node.setWorldPosition(this.$information.startLoc);
        this.node.emit(PRESET_EVENT_NAME.DRAG_DROP_OUTSIDE, data);
      }
    }

    this.$information = null!;
  }
}
