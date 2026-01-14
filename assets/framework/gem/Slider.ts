import { PRESET_EVENT_NAME } from 'fast/config/Event';
import { Gem } from './Gem';
import { _decorator, Node, Enum, EventTouch, Sprite, UITransform, Vec2 } from 'cc';

const { ccclass, menu, property } = _decorator;

/** 进度条类型 */
export enum SliderDirection {
  /** 水平 */
  Horizontal,
  /** 垂直 */
  Vertical,
}

/** 滑块贴边类型 */
export enum SliderEdgeType {
  /** 贴边 */
  In,
  /** 超边 */
  Out,
}

/**
 * 滑动条组件
 * @notes 滑动条
 */
@ccclass('Gem/Slider')
@menu('Gem/Slider')
export class Slider extends Gem {
  // ------------------------------- 属性声明区 -------------------------------
  /** 滑动条 */
  @property({ type: Sprite, displayName: '滑动条' })
  protected $bar: Sprite;

  /** 滑块 */
  @property({ type: Node, displayName: '滑块' })
  protected $block: Node;

  /** 方向 */
  @property({ type: Enum(SliderDirection), displayName: '方向', visible: false })
  protected $direction: SliderDirection = SliderDirection.Horizontal;
  /** 方向 */
  @property({ type: Enum(SliderDirection), displayName: '方向' })
  public get direction() {
    return this.$direction;
  }
  public set direction(dir: SliderDirection) {
    if (this.$direction !== dir) {
      this.$direction = dir;
      this.flush();
    }
  }

  /** 贴边 */
  @property({ type: Enum(SliderEdgeType), displayName: '贴边', visible: false })
  protected $edgeType: SliderEdgeType = SliderEdgeType.In;
  /** 贴边 */
  @property({ type: Enum(SliderEdgeType), displayName: '贴边' })
  protected get edgeType() {
    return this.$edgeType;
  }
  protected set edgeType(type: SliderEdgeType) {
    if (this.$edgeType !== type) {
      this.$edgeType = type;
      this.flush();
    }
  }

  /** 贴边补偿 */
  @property({ displayName: '贴边补偿', visible: false })
  protected $edgeOffset: Vec2 = new Vec2();
  /** 贴边补偿 */
  @property({ displayName: '贴边补偿' })
  public get edgeOffset() {
    return this.$edgeOffset;
  }
  public set edgeOffset(offset: Vec2) {
    if (!this.$edgeOffset.equals(offset)) {
      this.$edgeOffset.set(offset);
      this.flush();
    }
  }

  /** 进度 */
  @property({ displayName: '进度', min: 0, max: 1, step: 0.01, visible: false })
  protected $progress: number = 0;
  /** 进度 */
  @property({ displayName: '进度', min: 0, max: 1, step: 0.01 })
  public get progress() {
    return this.$progress;
  }
  public set progress(value: number) {
    value = Math.min(Math.max(value, 0), 1);
    if (this.$progress !== value) {
      this.$progress = value;
      this.flush();
    }
  }

  /** 是否处理滑块 */
  protected $blockHandled: boolean = false;

  // ------------------------------- 受限访问区 -------------------------------

  protected didCreate(): void {
    this.$bar ??= this.node.getChildByName('bar')?.getComponent(Sprite)!;
    this.$block ??= this.node.getChildByName('block')!;
    this.flush();
  }

  protected didAwake(): void {
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.$block?.on(Node.EventType.TOUCH_START, this.onSlideStart, this);
    this.$block?.on(Node.EventType.TOUCH_MOVE, this.onSlideMove, this);
    this.$block?.on(Node.EventType.TOUCH_CANCEL, this.onSlideCancel, this);
    this.$block?.on(Node.EventType.TOUCH_END, this.onSlideEnd, this);
  }

  protected didSuspend(): void {
    this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.$block?.off(Node.EventType.TOUCH_START, this.onSlideStart, this);
    this.$block?.off(Node.EventType.TOUCH_MOVE, this.onSlideMove, this);
    this.$block?.off(Node.EventType.TOUCH_CANCEL, this.onSlideCancel, this);
    this.$block?.off(Node.EventType.TOUCH_END, this.onSlideEnd, this);
  }

  /**
   * 点击滑动条
   * @notes 该事件会将滑块置于点击位置
   * @param evt 触摸事件
   */
  protected onTouchEnd(evt: EventTouch) {
    if (!this.$blockHandled) {
      this.onSlideMove(evt);
    }
  }

  /**
   * 点击滑块
   * @param evt 触摸事件
   */
  protected onSlideStart(evt: EventTouch) {
    if (!this.$blockHandled) {
      this.$blockHandled = true;
      this.$block.setScale(1.05, 1.05);
    }
  }

  /**
   * 滑动滑块
   * @param evt 触摸事件
   */
  protected onSlideMove(evt: EventTouch) {
    const loc = evt.getUILocation();
    const pos = this.node.uiTransform.convertToNodeSpaceAR(loc.toVec3());
    if (this.$direction === SliderDirection.Horizontal) {
      const half = (this.$bar.node.w - this.$block.w) * 0.5;
      const posX = Math.max(-half, Math.min(pos.x, half));
      this.$progress = (posX + half) / half / 2;
      this.flush();
    } else {
      const half = (this.$bar.node.h - this.$block.h) * 0.5;
      const posY = Math.max(-half, Math.min(pos.y, half));
      this.$progress = (posY + half) / half / 2;
      this.flush();
    }
  }

  /**
   * 点击滑块取消
   * @param evt 触摸事件
   */
  protected onSlideCancel(evt: EventTouch) {
    if (this.$blockHandled) {
      this.$blockHandled = false;
      this.$block.setScale(1, 1);
      this.node.emit(PRESET_EVENT_NAME.SLIDE_POS_CHANGED);
    }
  }

  /**
   * 点击滑块结束
   * @param evt 触摸事件
   */
  protected onSlideEnd(evt: EventTouch) {
    if (this.$blockHandled) {
      this.$blockHandled = false;
      this.$block.setScale(1, 1);
      this.node.emit(PRESET_EVENT_NAME.SLIDE_POS_CHANGED);
    }
  }

  /** 更新进度 */
  protected flush() {
    if (this.$direction === SliderDirection.Horizontal) {
      this.updateHorizontal();
    } else {
      this.updateVertical();
    }
  }

  /** 更新水平进度 */
  protected updateHorizontal() {
    const bar = this.$bar;
    if (bar) {
      bar.type = Sprite.Type.FILLED;
      bar.fillType = Sprite.FillType.HORIZONTAL;
      bar.fillRange = -1;
      bar.fillStart = this.$progress;
    }

    const block = this.$block;
    if (block && block.isValid) {
      const nv = this.$bar.node.getComponent(UITransform)!.width;
      const bv = block.getComponent(UITransform)!.width;
      const ev = (this.$edgeType == SliderEdgeType.Out ? 0 : bv) + this.$edgeOffset.x * 2;
      const px = ((nv - ev) * (this.progress - 0.5)) | 0;
      block.setPosition(px, 0);
    }
  }

  /** 更新垂直进度 */
  protected updateVertical() {
    const bar = this.$bar;
    if (bar) {
      bar.type = Sprite.Type.FILLED;
      bar.fillType = Sprite.FillType.VERTICAL;
      bar.fillRange = -1;
      bar.fillStart = this.$progress;
    }

    const block = this.$block;
    if (block && block.isValid) {
      const nv = this.$bar.node.getComponent(UITransform)!.height;
      const bv = block.getComponent(UITransform)!.height;
      const ev = (this.$edgeType == SliderEdgeType.Out ? 0 : bv) + this.$edgeOffset.y * 2;
      const px = ((nv - ev) * (this.progress - 0.5)) | 0;
      block.setPosition(0, px);
    }
  }
}
