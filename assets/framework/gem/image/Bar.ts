import { _decorator, Enum, Sprite, Vec2 } from 'cc';

import { ImageView } from './Image';

const { ccclass, menu, property } = _decorator;

/** 进度条类型 */
enum BarType {
  /** 水平（正向：从左到右） */
  Horizontal,
  /** 垂直（正向：从下到上） */
  Vertical,
  /** 圆圈（正向：顺时针） */
  Circle,
}

/** 进度条反向 */
enum BarDirection {
  /** 正向 */
  Forward,
  /** 反向 */
  Backward,
}

/**
 * 进度条组件
 * @notes 进度条
 * - 支持类型：水平、垂直、圆形
 * - 支持方向：正向、反向
 * - 圆形中心点：0.5，0.5
 * - 圆形起始点：同时钟的0点
 */
@ccclass('Gem/Bar')
@menu('Gem/Bar')
export class Bar extends ImageView {
  // ------------------------------- 静态成员区 -------------------------------

  /** 中心点 */
  private static Center = new Vec2(0.5, 0.5);

  // ------------------------------- 属性声明区 -------------------------------

  /** 进度条类型 */
  @property({ type: Enum(BarType), visible: false })
  protected $type: BarType = BarType.Horizontal;

  /** 进度条类型 */
  @property({ displayName: '类型', type: Enum(BarType) })
  get type() {
    return this.$type;
  }
  set type(type: BarType) {
    if (this.$type !== type) {
      this.$type = type;
      this.flush();
    }
  }

  /** 进度条方向 */
  @property({ type: Enum(BarDirection), visible: false })
  protected $direction: BarDirection = BarDirection.Forward;

  /** 进度条方向 */
  @property({ displayName: '方向', type: Enum(BarDirection) })
  get direction() {
    return this.$direction;
  }
  set direction(dir: BarDirection) {
    if (this.$direction !== dir) {
      this.$direction = dir;
      this.flush();
    }
  }

  /** 当前进度 */
  @property({ visible: false, min: 0, max: 1, step: 0.01 })
  protected $progress: number = 0;

  /** 当前进度 */
  @property({ displayName: '进度', min: 0, max: 1, step: 0.01 })
  get progress() {
    return this.$progress;
  }
  set progress(value: number) {
    value = Math.min(Math.max(value, 0), 1);
    if (this.$progress != value) {
      this.$progress = value;
      this.flush();
    }
  }

  /**
   * 更新进度
   * @returns
   */
  flush() {
    const bar = (this.$image ||= this.getComponent(Sprite)!);
    if (!bar) return;

    switch (this.$type) {
      case BarType.Horizontal:
        this.updateHorizontal();
        break;
      case BarType.Vertical:
        this.updateVertical();
        break;
      case BarType.Circle:
        this.updateCircle();
        break;
    }
  }

  // ------------------------------- 属性声明区 -------------------------------

  protected updateView(): void {
    super.updateView();
    this.flush();
  }

  /**
   * 更新水平进度
   */
  protected updateHorizontal() {
    const bar = this.$image;
    bar.type = Sprite.Type.FILLED;
    bar.fillType = Sprite.FillType.HORIZONTAL;
    if (this.$direction === BarDirection.Forward) {
      bar.fillRange = -1;
      bar.fillStart = this.$progress;
    } else {
      bar.fillRange = 1;
      bar.fillStart = 1 - this.$progress;
    }
  }

  /**
   * 更新垂直进度
   */
  protected updateVertical() {
    const bar = this.$image;
    bar.type = Sprite.Type.FILLED;
    bar.fillType = Sprite.FillType.VERTICAL;
    if (this.$direction === BarDirection.Forward) {
      bar.fillRange = -1;
      bar.fillStart = this.$progress;
    } else {
      bar.fillRange = 1;
      bar.fillStart = 1 - this.$progress;
    }
  }

  /**
   * 更新圆圈进度
   */
  protected updateCircle() {
    const bar = this.$image;
    bar.type = Sprite.Type.FILLED;
    bar.fillType = Sprite.FillType.RADIAL;
    bar.fillCenter = Bar.Center;
    bar.fillStart = 0.25;
    if (this.$direction === BarDirection.Forward) {
      bar.fillRange = -this.$progress;
    } else {
      bar.fillRange = this.$progress;
    }
  }
}
