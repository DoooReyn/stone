import { _decorator } from 'cc';

import { Gem } from '../Gem';
import { Ratio } from './Ratio';

const { ccclass, menu } = _decorator;

/**
 * 单选容器
 */
@ccclass('Gem/RatioGroup')
@menu('Gem/RatioGroup')
export class RatioGroup extends Gem {
  // ------------------------------- 静态成员区 -------------------------------

  /** 日志开关 */
  public static LogEnabled: boolean = true;

  // ------------------------------- 属性声明区 -------------------------------

  private _container: Ratio[] = [];
  private _selectedIndex: number = -1;

  // ------------------------------- 公开访问区 -------------------------------

  public get selectedIndex() {
    return this._selectedIndex;
  }
  public set selectedIndex(index: number) {
    this._setSelectedIndex(index);
  }

  private _setSelectedIndex(index: number) {
    const entry = this._container[index];
    if (entry && !entry.selected) {
      this._selectedIndex = index;
      this._container.forEach((e, i) => (i === index ? this._select(e) : this._unselect(e)));
      return true;
    }
    return false;
  }

  /**
   * 条目数量
   */
  get size() {
    return this._container.length;
  }

  /**
   * 是否包含指定条目
   * @param entry 条目
   * @returns
   */
  has(entry: Ratio) {
    return this.indexOf(entry) > -1;
  }

  /**
   * 获取指定条目的索引
   * @param entry 条目
   * @returns
   */
  indexOf(entry: Ratio) {
    return this._container.indexOf(entry);
  }

  /**
   * 新增条目
   * @param entry 条目
   */
  add(entry: Ratio) {
    !this.has(entry) && this._container.push(entry);
  }

  /**
   * 移除条目
   * @param entry 条目
   */
  remove(entry: Ratio) {
    const index = this.indexOf(entry);
    if (index > -1) this._container.splice(index, 1);
  }

  /**
   * 清空条目
   */
  clear() {
    this._container.length = 0;
  }

  /**
   * 告知条目状态变化
   * @param entry 变化条目
   */
  flush(entry: Ratio) {
    const index = this.indexOf(entry);
    if (this._setSelectedIndex(index)) {
      if (RatioGroup.LogEnabled) {
        this.logger.d(`当前选中: ${entry.gName}<${index}>`);
      }
    }
  }

  // ------------------------------- 受限访问区 -------------------------------

  private _select(entry: Ratio) {
    if (entry && !entry.selected) {
      entry.selected = true;
    }
  }

  private _unselect(entry: Ratio) {
    if (entry && entry.selected) {
      entry.selected = false;
    }
  }
}
