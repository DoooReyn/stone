import { settings, _decorator, EventTouch, Label, Node, Sorting2D, Vec2 } from 'cc';

import { Gem } from './Gem';

const { ccclass, menu } = _decorator;

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
  /** 是否支持 2D 渲染排序 */
  public static readonly HasSorting2D = Sorting2D !== undefined;

  /**
   * 为节点设置 2D 渲染排序层级
   * @param sortingNode - 需要设置排序的节点
   * @param sortingLayer - 排序层级值（对应项目设置中的 sortingLayers）
   * @param sortingOrder - 可选，排序顺序值，同一层级内数值越大越靠前
   * @remarks
   * - 如果引擎版本不支持 Sorting2D 组件，会输出警告并直接返回
   * - 如果指定的 sortingLayer 不存在，会使用默认层级并输出警告
   * - 此方法会自动获取或添加 Sorting2D 组件到目标节点
   */
  public static ChangeUISortingLayer(sortingNode: Node, sortingLayer: number, sortingOrder?: number) {
    if (!ListItem.HasSorting2D) {
      console.warn('⚠️ 当前引擎版本不支持 Sorting2D 组件，如果需要请切换到 3.8.7 及以上版本');
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
      console.warn(`⚠️ 未找到对应的渲染排序层级:${sortingLayer}，请检查是否已在项目设置中配置。将使用默认层级代替。`);
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

  /**
   * 组件唤醒时的初始化
   * @remarks
   * - 注册所有触摸事件监听器
   * - 事件在组件生命周期内保持不变
   * @override
   */
  protected didAwake() {
    // 一次性注册事件，生命周期内不变
    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
  }

  /**
   * 组件挂起时的清理
   * @remarks
   * - 移除所有触摸事件监听器
   * - 防止内存泄漏
   * @override
   */
  protected didSuspend() {
    // 清理事件
    this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
  }

  /**
   * 启用渲染分层，将所有子节点的 Label 组件独立排序
   * @remarks
   * - 每个 Label 组件分配独立的 orderNumber，避免交错导致的合批中断
   * - 通常用于解决复杂 UI 中的渲染顺序问题
   * @example
   * ```typescript
   * listItem.onSortLayer(); // 启用渲染分层
   * listItem.offSortLayer(); // 禁用渲染分层
   * ```
   */
  public onSortLayer() {
    let orderNumber = 1;
    const labels = this.node.getComponentsInChildren(Label);
    for (let i = 0; i < labels.length; i++) {
      ListItem.ChangeUISortingLayer(labels[i].node, 0, orderNumber);
      orderNumber++;
    }
  }

  /**
   * 禁用渲染分层，将所有 Label 组件重置到默认排序层级
   * @remarks
   * - 所有 Label 组件的 orderNumber 都会被重置为 0
   * - 与 {@link onSortLayer} 配合使用，用于动态切换渲染分层状态
   */
  public offSortLayer() {
    const orderNumber = 0;
    const labels = this.node.getComponentsInChildren(Label);
    for (let i = 0; i < labels.length; i++) {
      ListItem.ChangeUISortingLayer(labels[i].node, 0, orderNumber);
      // const item = labels[i];
      // const sort2d = item.node.getComponent(Sorting2D);
      // sort2d && (sort2d.enabled = false);
      // orderNumber++;
    }
  }

  /**
   * 设置当前 item 对应的数据索引
   * @param index - 数据索引值，通常对应数据源中的位置
   * @remarks
   * - 由虚拟列表组件在复用 item 时调用
   * - 索引用于在点击和长按回调中标识当前 item
   */
  public setDataIndex(index: number) {
    this.dataIndex = index;
  }

  /**
   * 每帧更新
   * @param dt - 帧间隔时间（秒）
   * @remarks
   * - 如果正在触摸且未取消，累加长按计时器
   * - 当计时器达到阈值时触发长按事件
   * @override
   */
  protected update(dt: number): void {
    // 如果正在触摸且未取消，累加长按计时
    if (this._touchStartNode && !this._isCanceled && !this._isLongPressed) {
      this._longPressTimer += dt;
      if (this._longPressTimer >= this.longPressTime) {
        this.triggerLongPress();
      }
    }
  }

  /**
   * 触发长按事件
   * @remarks
   * - 设置长按标志位，防止重复触发
   * - 调用长按回调函数（如果已设置）
   * - 恢复节点缩放状态
   * @private
   */
  private triggerLongPress() {
    this._isLongPressed = true;
    if (this.onLongPressCallback) {
      this.onLongPressCallback(this.dataIndex);
    }
    // 触发长按后恢复缩放
    this.restoreScale();
  }

  /**
   * 触摸开始事件处理
   * @param e - 触摸事件对象
   * @remarks
   * - 初始化触摸状态和计时器
   * - 记录触摸起始位置
   * - 如果启用了点击效果，执行缩放反馈
   * @private
   */
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

  /**
   * 触摸移动事件处理
   * @param e - 触摸事件对象
   * @remarks
   * - 计算触摸移动距离
   * - 如果移动距离超过阈值，判定为滑动操作，取消点击和长按
   * @private
   */
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

  /**
   * 触摸结束事件处理
   * @param e - 触摸事件对象
   * @remarks
   * - 如果已取消或已触发长按，重置状态并返回
   * - 计算触摸移动距离，小于阈值则判定为点击
   * - 触发点击回调（如果已设置）
   * - 重置所有触摸相关状态
   * @private
   */
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

  /**
   * 触摸取消事件处理
   * @param e - 触摸事件对象
   * @remarks
   * - 恢复节点缩放状态
   * - 重置所有触摸相关状态
   * @private
   */
  private onTouchCancel(e: EventTouch) {
    this.restoreScale();
    this.reset();
  }

  /**
   * 恢复节点缩放状态
   * @remarks
   * - 如果启用了点击效果，将节点缩放恢复到 1.0
   * - 通常在触摸结束或取消时调用
   * @private
   */
  private restoreScale() {
    if (this.useItemClickEffect && this.node.children.length > 0) {
      this.node.setScale(1.0, 1.0);
    }
  }

  /**
   * 重置触摸相关状态
   * @remarks
   * - 清除触摸起始节点
   * - 重置取消标志
   * - 重置长按计时器和标志
   * - 通常在触摸结束或取消时调用
   * @private
   */
  private reset() {
    this._touchStartNode = null;
    this._isCanceled = false;
    this._longPressTimer = 0;
    this._isLongPressed = false;
  }
}
