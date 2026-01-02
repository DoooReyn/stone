import { v2, _decorator, Enum, EventMouse, EventTouch, Node, Vec2 } from 'cc';
import { PRESET_EVENT_NAME } from 'fast/config/Event';
import { PRESET_GUI } from 'fast/config/Gui';
import { fast } from 'fast/Fast';
import { platform } from 'fast/util';

import { Gem } from '../Gem';

const { ccclass, menu, property } = _decorator;

/**
 * 按钮状态
 * - 正常 Normal
 * - 按下 Pressed
 * - 禁用 Disabled
 */
export enum ButtonState {
  Normal,
  Pressed,
  Disabled,
}

@ccclass('Gem/Button')
@menu('Gem/Button')
export class Button extends Gem {
  // ------------------------------- 属性声明区 -------------------------------

  /** 按钮状态 */
  @property({ displayName: '按钮状态', type: Enum(ButtonState) })
  protected $state: ButtonState = ButtonState.Normal;

  /** 支持点击否？ */
  @property({ displayName: '支持点击否？' })
  protected $clickEnabled: boolean = true;

  /** 支持长按否？ */
  @property({ displayName: '支持长按否？' })
  protected $holdEnabled: boolean = false;

  /** 支持悬停否？ */
  @property({ displayName: '支持悬停否？' })
  protected $hoverEnabled: boolean = false;

  /** 长按阈值（秒） */
  @property({
    displayName: '长按阈值（秒）',
    min: 0,
    step: 0.1,
    visible(): boolean {
      return this.$holdEnabled;
    },
  })
  protected $holdStartTime: number = 0.3;

  /** 长按频次（秒） */
  @property({
    displayName: '长按频次（秒）',
    min: 0,
    step: 0.01,
    visible(): boolean {
      return this.$holdEnabled;
    },
  })
  protected readonly $holdingTime: number = 0.03;

  /** 长按滑动阈值（像素） */
  @property({
    displayName: '长按滑动阈值（像素）',
    min: 0,
    step: 10,
    visible(): boolean {
      return this.$holdEnabled;
    },
  })
  protected $holdDistance: number = 50;

  /** 是否按下 */
  protected $pressed: boolean = false;
  /** 是否触发长按阈值 */
  protected $holding: boolean = false;
  /** 是否悬停 */
  protected $hovering: boolean = false;
  /** 按下时的时间点 */
  protected $startTime: number = 0;
  /** 按下时的落点 */
  protected $startLoc: Vec2 = v2();
  /** 长按计时 */
  protected $holdingCounter: number = 0;
  /** 长按计次 */
  protected $holdingFrequence: number = 0;
  /** 长按触发计时点 */
  protected $holdingLastTime: number = 0;
  /** 节点路径 */
  protected $path: string = '';

  // ------------------------------- 公开访问区 -------------------------------

  /** 当前按钮状态 */
  public get state() {
    return this.$state;
  }

  /** 支持点击否？ */
  public get clickable() {
    return this.$clickEnabled;
  }
  public set clickable(enabled: boolean) {
    this.$clickEnabled = enabled;
  }

  /** 支持长按否？ */
  public get holdable() {
    return this.$holdEnabled;
  }
  public set holdable(enabled: boolean) {
    this.$holdEnabled = enabled;
  }

  /** 支持悬停否？ */
  public get hoverable() {
    return this.$hoverEnabled;
  }
  public set hoverable(enabled: boolean) {
    this.$hoverEnabled = enabled;
  }

  // ------------------------------- 受限访问区 -------------------------------

  protected didAwake(): void {
    this._onStateChanged(ButtonState.Normal);
    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    if (platform.desktop && this.$hoverEnabled) {
      this.node.on(Node.EventType.MOUSE_ENTER, this.onMouseEnter, this);
      this.node.on(Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
    }
  }

  protected didSuspend(): void {
    this._onStateChanged(ButtonState.Disabled);
    this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    if (platform.desktop && this.$hoverEnabled) {
      this.node.off(Node.EventType.MOUSE_ENTER, this.onMouseEnter, this);
      this.node.off(Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
    }
  }

  protected didLaunch(): void {
    this.$path = this.node.pathOf();
  }

  protected didPostTick(dt: number): void {
    if (this.$holdEnabled) {
      if (this.$pressed) {
        this.onHolding(dt);
      }
    }
  }

  /**
   * 触摸落下
   * @param evt 触摸事件
   */
  protected onTouchStart(evt: EventTouch) {
    if (this.$state === ButtonState.Normal) {
      const now = Date.now();
      if (now - this.$startTime >= PRESET_GUI.CLICK_INTERVAL_MS) {
        this.$startTime = now;
        this.$pressed = true;
        this.$startLoc = evt.getStartLocation();
        this._onStateChanged(ButtonState.Pressed);

        if (this.$clickEnabled) {
          this.node.emit(PRESET_EVENT_NAME.BTN_CLICK_START);
          this.onClickStart();
        }
      }
    }
  }

  /**
   * 触摸移动
   * @param evt 触摸事件
   */
  protected onTouchMove(evt: EventTouch) {
    if (this.$pressed) {
      if (this.$holdEnabled) {
        const distance = Vec2.distance(evt.getLocation(), this.$startLoc);
        if (distance >= this.$holdDistance) {
          this._onHoldEnd();
        }
      }
    }
  }

  /**
   * 触摸松开
   * @param evt 触摸事件
   */
  protected onTouchEnd(evt: EventTouch) {
    if (this.$pressed) {
      this.$pressed = false;
      this._onStateChanged(ButtonState.Normal);

      if (this.$clickEnabled) {
        this.node.emit(PRESET_EVENT_NAME.BTN_CLICK_END);
        this.onClickEnd();
      }

      if (this.$holdEnabled) {
        this._onHoldEnd();
      }
    }
  }

  /**
   * 触摸取消
   * @param evt 触摸事件
   */
  protected onTouchCancel(evt: EventTouch) {
    if (this.$pressed) {
      this.$pressed = false;
      this._onStateChanged(ButtonState.Normal);

      if (this.$clickEnabled) {
        this.node.emit(PRESET_EVENT_NAME.BTN_CLICK_CANCEL);
        this.onClickCancel();
      }

      if (this.$holdEnabled) {
      }
    }
  }

  /**
   * 鼠标移入
   * @param evt 鼠标事件
   */
  protected onMouseEnter(evt: EventMouse) {
    // 仅在按钮处于正常状态下有效
    if (this.$state === ButtonState.Normal) {
      if (!this.$hovering) {
        this.$hovering = true;
        this.node.emit(PRESET_EVENT_NAME.BTN_HOVER_IN);
        this.onHoverIn();
      }
    }
  }

  /**
   * 鼠标移出
   * @param evt 鼠标事件
   */
  protected onMouseLeave(evt: EventMouse) {
    // 仅在按钮处于正常状态下有效
    if (this.$state === ButtonState.Normal) {
      if (this.$hovering) {
        this.$hovering = false;
        this.node.emit(PRESET_EVENT_NAME.BTN_HOVER_OUT);
        this.onHoverOut();
      }
    }
  }

  /**
   * 长按结束
   */
  private _onHoldEnd() {
    if (this.$holding) {
      this.$holding = false;
      this.$holdingCounter = 0;
      this.$holdingLastTime = 0;
      this.$holdingFrequence = 0;
      this.node.emit(PRESET_EVENT_NAME.BTN_HOLD_END);
      this.onHoldEnd();
    }
  }

  /**
   * 按钮状态切换
   * @param curr 当前状态
   */
  private _onStateChanged(curr: ButtonState) {
    const prev = this.$state;
    this.$state = curr;
    if (prev !== curr) {
      this.node.emit(PRESET_EVENT_NAME.BTN_STATE_CHANGED, prev, curr);
    }
    this.onStateChanged(prev, curr);
  }

  /**
   * 累积长按时间
   * @param dt 时间片
   */
  protected onHolding(dt: number) {
    this.$holdingCounter += dt;
    if (this.$holdingCounter >= this.$holdStartTime) {
      if (!this.$holding) {
        this.$holding = true;
        this.$holdingCounter = 0;
        this.$holdingFrequence = 0;
        this.$holdingLastTime = this.$holdingCounter;
        this.node.emit(PRESET_EVENT_NAME.BTN_HOLD_START);
        this.onHoldStart();
      } else {
        const rest = this.$holdingCounter - this.$holdingLastTime - this.$holdingTime;
        if (rest >= 0) {
          this.$holdingLastTime = this.$holdingCounter - rest;
          this.$holdingFrequence++;
          this.node.emit(PRESET_EVENT_NAME.BTN_HOLD_COUNT, this.$holdingFrequence, this.$holdingTime);
          this.onHoldCount(this.$holdingFrequence);
        }
      }
    }
  }

  /**
   * 按钮状态切换回调
   * @notes 子类可复写此方法
   * @param prev 上次状态
   * @param curr 当前状态
   */
  protected onStateChanged(prev: ButtonState, curr: ButtonState) {
    fast.logger.d(this.$path, '按钮状态切换', prev, curr);
  }

  /**
   * 鼠标移入回调
   * @notes 子类可复写此方法
   */
  protected onHoverIn() {
    fast.logger.d(this.$path, '鼠标移入');
  }

  /**
   * 鼠标移出回调
   * @notes 子类可复写此方法
   */
  protected onHoverOut() {
    fast.logger.d(this.$path, '鼠标移出');
  }

  /**
   * 触摸落下回调
   * @notes 子类可复写此方法
   */
  protected onClickStart() {
    fast.logger.d(this.$path, '触摸落下');
  }

  /**
   * 触摸结束回调
   * @notes 子类可复写此方法
   */
  protected onClickEnd() {
    fast.logger.d(this.$path, '触摸结束');
  }

  /**
   * 触摸取消回调
   * @notes 子类可复写此方法
   */
  protected onClickCancel() {
    fast.logger.d(this.$path, '触摸取消');
  }

  /**
   * 长按开始回调
   * @notes 子类可复写此方法
   */
  protected onHoldStart() {
    fast.logger.d(this.$path, '长按开始');
  }

  /**
   * 长按计次回调
   * @param count 当前频次
   * @notes 子类可复写此方法
   */
  protected onHoldCount(count: number) {
    fast.logger.d(this.$path, '长按计次', count);
  }

  /**
   * 长按结束（取消）回调
   * @notes 子类可复写此方法
   */
  protected onHoldEnd() {
    fast.logger.d(this.$path, '长按结束（取消）');
  }
}
