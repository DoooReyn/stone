import { director, game, screen, view, Camera, Canvas, Director, Game, Node, Scene } from 'cc';
import { PRESET_EVENT_NAME } from 'fast/config/Event';
import { PRESET_GUI } from 'fast/config/Gui';
import { PRESET_TOKEN } from 'fast/config/Token';
import { FastError } from 'fast/foundation/Error';
import { Plugin } from 'fast/foundation/Plugin';
import { digit, misc, time } from 'fast/util';

import { IEventBusPlugin } from '../event-bus/IEventBusPlugin';
import { ITimerPlugin } from '../timer/ITimerPlugin';
import { IAppPlugin } from './IAppPlugin';

/**
 * 应用
 */
export class AppPlugin extends Plugin implements IAppPlugin {
  static readonly Token: string = PRESET_TOKEN.APP;

  scene: Scene;
  stage: Canvas;
  root: Node;
  camera2D: Camera;

  /** 时间记录点：回调前台 */
  private _timeEnterFG: number = 0;

  /** 时间记录点：进入后台 */
  private _timeEnterBG: number = 0;

  protected readonly $dependencies: string[] = [PRESET_TOKEN.EVENT_BUS, PRESET_TOKEN.TIMER];

  private setup(scene: Scene | null) {
    if (!scene) return;

    // 场景
    this.scene = scene;

    // 根节点： PRESET.ROOT
    const root = scene.getChildByName(PRESET_GUI.ROOT);
    if (!root) {
      throw new FastError(this.token, `未正确配置根节点`);
    }
    this.root = root!;

    // 舞台
    const stage = this.root.getComponent(Canvas);
    if (!stage) {
      throw new FastError(this.token, '根节点未挂载画布组件');
    }
    this.stage = stage!;

    // 2D相机: PRESET.CAMERA_2D
    const cameraNode = this.root.getChildByName(PRESET_GUI.CAMERA_2D);
    if (!cameraNode) {
      throw new FastError(this.token, '未正确配置2D相机节点');
    }

    // 2D相机组件
    const camera2D = cameraNode!.getComponent(Camera);
    if (!camera2D) {
      throw new FastError(this.token, `未正确配置摄像机组件`);
    }
    this.camera2D = camera2D!;

    // 代理窗口尺寸变换事件
    this.onScreenSizeChangedMock = misc.throttle(this.onScreenSizeChanged, this).bind(this);

    // 注册基础事件
    game.on(Game.EVENT_SHOW, this.onEnterFG, this);
    game.on(Game.EVENT_HIDE, this.onEnterBG, this);
    game.on(Game.EVENT_CLOSE, this.onEnded, this);
    game.on(Game.EVENT_LOW_MEMORY, this.onLowMemory, this);
    screen.on(PRESET_EVENT_NAME.SCREEN_SIZE_CHANGED, this.onScreenSizeChangedMock, this);
    screen.on(PRESET_EVENT_NAME.SCREEN_FULL_CHANGED, this.onScreenSizeChangedMock, this);
    screen.on(PRESET_EVENT_NAME.SCREEN_ORIENTATION_CHANGED, this.onScreenOrientationChanged, this);
    director.on(Director.EVENT_AFTER_UPDATE, this.onUpdate, this);
  }

  onInitialize() {
    return new Promise<void>((resolve, reject) => {
      const scene = director.getScene();
      if (scene) {
        this.setup(scene);
        resolve();
      } else {
        director.once(
          Director.EVENT_AFTER_SCENE_LAUNCH,
          (scene) => {
            this.setup(scene);
            resolve();
          },
          this
        );
      }
    });
  }

  /**
   * 获取从后台返回前台耗时
   * @description 开发者可以根据时长决定是否执行某些操作
   */
  public get elapsed() {
    return this._timeEnterFG - this._timeEnterBG;
  }

  /** 回到前台  */
  private onEnterFG(): void {
    this._timeEnterFG = time.now();
    const diff = digit.keepBits((this._timeEnterFG - this._timeEnterBG) / 1000, 2);
    this.logger.d(`回到前台，耗时: ${diff} 秒`);
    this.of<IEventBusPlugin>(PRESET_TOKEN.EVENT_BUS).app.emit(PRESET_EVENT_NAME.ENTER_FOREGROUND);
  }

  /** 进入后台  */
  private onEnterBG(): void {
    this._timeEnterBG = time.now();
    this.logger.d('进入后台');
    this.of<IEventBusPlugin>(PRESET_TOKEN.EVENT_BUS).app.emit(PRESET_EVENT_NAME.ENTER_BACKGROUND);
  }

  /** 关闭应用 */
  private onEnded(): void {
    this.of<ITimerPlugin>(PRESET_TOKEN.TIMER).stop();
    game.off(Game.EVENT_SHOW, this.onEnterFG, this);
    game.off(Game.EVENT_HIDE, this.onEnterBG, this);
    game.off(Game.EVENT_CLOSE, this.onEnded, this);
    game.off(Game.EVENT_LOW_MEMORY, this.onLowMemory, this);
    screen.off(PRESET_EVENT_NAME.SCREEN_SIZE_CHANGED, this.onScreenSizeChangedMock, this);
    screen.off(PRESET_EVENT_NAME.SCREEN_FULL_CHANGED, this.onScreenSizeChangedMock, this);
    screen.off(PRESET_EVENT_NAME.SCREEN_ORIENTATION_CHANGED, this.onScreenOrientationChanged, this);
    this.of<IEventBusPlugin>(PRESET_TOKEN.EVENT_BUS).app.emit(PRESET_EVENT_NAME.EXIT);
  }

  /** 内存警告 */
  private onLowMemory(): void {
    this.logger.d('应用内存不足');
    this.of<IEventBusPlugin>(PRESET_TOKEN.EVENT_BUS).app.emit(PRESET_EVENT_NAME.LOW_MEMORY);
  }

  /** 窗口尺寸变化 */
  private onScreenSizeChanged(): void {
    const size = view.getVisibleSize();
    this.logger.d('应用窗口尺寸变化', size.toString());
    this.of<IEventBusPlugin>(PRESET_TOKEN.EVENT_BUS).app.emit(PRESET_EVENT_NAME.SCREEN_SIZE_CHANGED, size);
  }

  /** 窗口尺寸变化代理 */
  private onScreenSizeChangedMock: () => void;

  /** 屏幕朝向变化 */
  private onScreenOrientationChanged(orientation: number): void {
    this.logger.d('应用设备朝向变化', orientation);
    this.of<IEventBusPlugin>(PRESET_TOKEN.EVENT_BUS).app.emit(
      PRESET_EVENT_NAME.SCREEN_ORIENTATION_CHANGED,
      orientation
    );
  }

  /**
   * 系统定时器更新
   */
  private onUpdate() {
    this.of<ITimerPlugin>(PRESET_TOKEN.TIMER).update(game.deltaTime);
  }
}
