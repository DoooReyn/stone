import { settings, _decorator, EventTouch, Label, Node, Sorting2D, Vec2 } from 'cc';

import { Gem } from './Gem';

const { ccclass, menu } = _decorator;

/** 是否支持 2D 渲染排序 */
const HasSorting2D = Sorting2D !== undefined;
if (!HasSorting2D) {
  console.warn('❌当前引擎版本不支持 Sorting2D 组件，如果需要请切换到 3.8.7 及以上版本');
}

/**
 * 更改UI节点的渲染排序层级
 * @param Node 节点
 * @param number 层级
 * @param number 顺序
 */
export function changeUISortingLayer(sortingNode: Node, sortingLayer: number, sortingOrder?: number) {
  if (!HasSorting2D) {
    return;
  }

  let sortingLayers = settings.querySettings('engine', 'sortingLayers') as any[];

  // 编辑器bug，默认有default，但是读取出来没有，需要自己配置一个后才会有默认数据
  if (!sortingLayers || sortingLayers.length === 0) {
    sortingLayers = [{ id: 0, value: 0, name: 'default' }];
  }

  const result = sortingLayers.find((layer) => layer.value === sortingLayer);
  if (!result) {
    // 如果没有找到对应的layer，则使用引擎内置默认层，并给出警告
    console.warn(`❌未找到对应的sortingLayer:${sortingLayer}，请检查是否已在项目设置中配置该层级。将使用默认层级代替。`);
    sortingLayer = sortingLayers[0].value;
  }

  const sort2d = sortingNode.acquire(Sorting2D);
  if (sort2d) {
    sort2d.sortingLayer = sortingLayer;
    if (sortingOrder !== undefined) {
      sort2d.sortingOrder = sortingOrder;
    }
  }
}

/**
 * 虚拟列表子项组件
 * @description 修改自 https://github.com/soidaken/VScrollView
 * @notes
 * - 挂载在每个 item 预制体的根节点上
 * - 负责处理点击逻辑，通过回调通知父组件
 */
@ccclass('Gem/ListItem')
@menu('Gem/ListItem')
export class ListItem extends Gem {
  /** 当前 item 对应的数据索引 */
  public dataIndex: number = -1;

  /** 是否使用点击反馈 */
  public useItemClickEffect: boolean = true;

  /** 点击回调（由虚拟列表注入） */
  public onClickCallback: ((index: number) => void) | null = null;

  /** 长按回调（由虚拟列表注入） */
  public onLongPressCallback: ((index: number) => void) | null = null;

  /** 长按触发时长（秒） */
  public longPressTime: number = 0.6;

  private _touchStartNode: Node | null = null;
  private _isCanceled: boolean = false;
  private _startPos: Vec2 = new Vec2();
  private _moveThreshold: number = 40; // 滑动阈值
  private _clickThreshold: number = 10; // 点击阈值
  private _longPressTimer: number = 0; // 长按计时器
  private _isLongPressed: boolean = false; // 是否已触发长按

  protected didAwake() {
    // 一次性注册事件，生命周期内不变
    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
  }

  protected didSuspend() {
    // 清理事件
    this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
  }

  /**
   * 将所有子节点的 Label 组件渲染单独排序在一起,并且item的每个lable组件都独立一个orderNumber,以免交错断合批
   * @param node
   */
  public onSortLayer() {
    let orderNumber = 1;
    const labels = this.node.getComponentsInChildren(Label);
    for (let i = 0; i < labels.length; i++) {
      changeUISortingLayer(labels[i].node, 0, orderNumber);
      orderNumber++;
    }
  }

  /** 关闭渲染分层 */
  public offSortLayer() {
    const orderNumber = 0;
    const labels = this.node.getComponentsInChildren(Label);
    for (let i = 0; i < labels.length; i++) {
      changeUISortingLayer(labels[i].node, 0, orderNumber);
      // const item = labels[i];
      // const sort2d = item.node.getComponent(Sorting2D);
      // sort2d && (sort2d.enabled = false);
      // orderNumber++;
    }
  }

  /** 外部调用：更新数据索引 */
  public setDataIndex(index: number) {
    this.dataIndex = index;
  }

  protected update(dt: number): void {
    // 如果正在触摸且未取消，累加长按计时
    if (this._touchStartNode && !this._isCanceled && !this._isLongPressed) {
      this._longPressTimer += dt;
      if (this._longPressTimer >= this.longPressTime) {
        this.triggerLongPress();
      }
    }
  }

  private triggerLongPress() {
    this._isLongPressed = true;
    if (this.onLongPressCallback) {
      this.onLongPressCallback(this.dataIndex);
    }
    // 触发长按后恢复缩放
    this.restoreScale();
  }

  private onTouchStart(e: EventTouch) {
    // console.log("_onTouchStart");
    this._touchStartNode = this.node;
    this._isCanceled = false;
    this._isLongPressed = false;
    this._longPressTimer = 0;
    e.getLocation(this._startPos);

    // 缩放反馈（假设第一个子节点是内容容器）
    if (this.useItemClickEffect && this.node.children.length > 0) {
      this.node.setScale(0.95, 0.95);
    }
  }

  private onTouchMove(e: EventTouch) {
    if (this._isCanceled) return;

    const movePos = e.getLocation();
    const dx = movePos.x - this._startPos.x;
    const dy = movePos.y - this._startPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 超过阈值认为是滑动，取消点击和长按
    if (dist > this._moveThreshold) {
      this._isCanceled = true;
      this.restoreScale();
      this._touchStartNode = null;
    }
  }

  private onTouchEnd(e: EventTouch) {
    if (this._isCanceled) {
      this.reset();
      return;
    }

    // 如果已经触发了长按，不再触发点击
    if (this._isLongPressed) {
      this.reset();
      return;
    }

    this.restoreScale();

    const endPos = e.getLocation();
    const dx = endPos.x - this._startPos.x;
    const dy = endPos.y - this._startPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 移动距离小于阈值才算点击
    if (dist < this._clickThreshold && this._touchStartNode === this.node) {
      if (this.onClickCallback) {
        this.onClickCallback(this.dataIndex);
      }
    }

    this.reset();
  }

  private onTouchCancel(e: EventTouch) {
    this.restoreScale();
    this.reset();
  }

  private restoreScale() {
    if (this.useItemClickEffect && this.node.children.length > 0) {
      this.node.setScale(1.0, 1.0);
    }
  }

  private reset() {
    this._touchStartNode = null;
    this._isCanceled = false;
    this._longPressTimer = 0;
    this._isLongPressed = false;
  }
}
