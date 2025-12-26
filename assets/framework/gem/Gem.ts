import { js, _decorator, Component } from 'cc';
import { logcat, Logger } from 'fast/foundation/Logcat';
import { next } from 'fast/util/AscendingId';

const { ccclass, executeInEditMode } = _decorator;

/**
 * 元组件
 * @description 元组件全面代理了组件的生命周期，并进一步完善（原始的生命周期不建议混用），以下是新版生命周期：
 *
 * - 创建 `didCreate` 只会执行一次
 * - 工作 `didAwake`
 * - 启动 `didLaunch` 只会执行一次
 * - 休眠 `didSuspend`
 * - 更新前 `didTick`
 * - 更新后 `didPostTick`
 * - 终止前 `didTerminate` 只会执行一次
 * - 终止后 `didPostTerminate` 只会执行一次
 *
 * 第一次
 *
 * 1. `didCreate`
 * 2. `didAwake`
 * 3. `didLaunch`
 *
 * 禁用
 *
 * 1. `didSuspend`
 *
 * 重新启用
 *
 * 1. `didAwake`
 *
 * 删除
 * 1. `didSuspend`
 * 2. `didTerminate`
 * 3. `didPostTerminate`
 */
@ccclass('Gem')
export class Gem extends Component {
  /** 组件类型 */
  get gType() {
    return ((this as unknown as { $typeName: string }).$typeName ??= js.getClassName(this));
  }

  /** 组件唯一编号 */
  get gID() {
    return ((this as unknown as { $gID: number }).$gID ??= next(this.gType));
  }

  /** 组件唯一标识 */
  get gName() {
    return ((this as unknown as { $gName: string }).$gName ??= this.gType + '.' + this.gID);
  }

  /** 组件专属日志 */
  get logger(): Logger {
    return logcat.acquire(this.gType);
  }

  protected onLoad(): void {
    this.didCreate();
  }

  protected start(): void {
    this.didLaunch();
  }

  protected onEnable(): void {
    this.didAwake();
  }

  public _onPreDestroy() {
    this.didTerminate();
    super._onPreDestroy();
  }

  protected onDisable(): void {
    this.didSuspend();
  }

  protected onDestroy(): void {
    this.didPostTerminate();
  }

  protected update(dt: number): void {
    this.didTick(dt);
  }

  protected lateUpdate(dt: number): void {
    this.didPostTick(dt);
  }

  /** 组件创建时回调 */
  protected didCreate(): void {}

  /** 组件启动时回调 */
  protected didLaunch(): void {}

  /** 组件被唤醒时回调 */
  protected didAwake(): void {}

  /** 组件被挂起时回调 */
  protected didSuspend(): void {}

  /** 组件被终止时回调 */
  protected didTerminate(): void {}

  /** 组件被终止后回调 */
  protected didPostTerminate(): void {}

  /** 组件更新时回调 */
  protected didTick(dt?: number): void {}

  /** 组件更新后回调 */
  protected didPostTick(dt?: number): void {}
}
