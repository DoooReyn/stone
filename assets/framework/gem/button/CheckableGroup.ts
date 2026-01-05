import { _decorator } from 'cc';
import { fast } from 'fast/Fast';

import { Gem } from '../Gem';
import { Checkable } from './Checkable';

const { ccclass, menu } = _decorator;

/**
 * 复选容器
 */
@ccclass('Gem/CheckableGroup')
@menu('Gem/CheckableGroup')
export class CheckableGroup extends Gem {
  // ------------------------------- 静态成员区 -------------------------------

  /** 日志开关 */
  public static LogEnabled: boolean = true;

  /**
   * 格式化条目状态
   * @param entries 条目列表
   * @param tag 标记
   * @returns
   */
  public static Fmt(entries: Checkable[], tag: string) {
    const list = entries.map((e) => e.gName + ':' + (e.checked ? '选中' : '未选中'));
    list.unshift(tag);
    return list.join('\n ');
  }

  // ------------------------------- 属性声明区 -------------------------------

  /** 脏标记 */
  private _dirty: boolean = false;

  /** 脏条目记录 */
  private _dirtyEntries: Checkable[] = [];

  /** 复选条目容器 */
  private _container: Checkable[] = [];

  // ------------------------------- 公开访问区 -------------------------------

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
  has(entry: Checkable) {
    return this.indexOf(entry) > -1;
  }

  /**
   * 获取指定条目的索引
   * @param entry 条目
   * @returns
   */
  indexOf(entry: Checkable) {
    return this._container.indexOf(entry);
  }

  /**
   * 新增条目
   * @param entry 条目
   */
  add(entry: Checkable) {
    !this.has(entry) && this._container.push(entry);
  }

  /**
   * 移除条目
   * @param entry 条目
   */
  remove(entry: Checkable) {
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
   * 选中条目
   * @param entry 当前条目
   */
  select(entry: Checkable) {
    if (this.has(entry)) {
      entry.checked = true;
    }
  }

  /**
   * 选中索引条目
   * @param index 索引
   */
  selectIndex(index: number) {
    const entry = this._container[index];
    if (entry) entry.checked = true;
  }

  /**
   * 选中限定索引条目
   * @param indexes 索引条目列表
   * @param solo 是否仅选中限定条目（除此之外全不选）
   */
  selectIndexes(indexes: number[], solo: boolean = false) {
    const ranges = indexes.map((idx) => this._container[idx]).filter((v) => v !== undefined);
    this.selectRange(ranges, solo);
  }

  /**
   * 选中限定条目
   * @param ranges 条目列表
   * @param solo 是否仅选中限定条目（除此之外全不选）
   */
  selectRange(ranges: Checkable[], solo: boolean = false) {
    if (solo) {
      // 仅选中限定条目
      for (let i = 0; i > ranges.length; i++) {
        if (!this.has(ranges[i])) {
          ranges.splice(i, 1);
          i--;
        }
      }
      this._container.forEach((e) => {
        e.checked = ranges.includes(e);
      });
    } else {
      // 选中限定条目
      ranges.forEach((e) => this.select(e));
    }
  }

  /**
   * 全选
   */
  selectAll() {
    this._container.forEach((e) => (e.checked = true));
  }

  /**
   * 反选
   */
  selectInvert() {
    this._container.forEach((e) => {
      e.checked = !e.checked;
    });
  }

  /**
   * 不选条目
   * @param entry 当前条目
   */
  unselect(entry: Checkable) {
    if (this.has(entry)) {
      entry.checked = false;
    }
  }

  /**
   * 不选索引条目
   * @param index
   */
  unselectIndex(index: number) {
    const entry = this._container[index];
    if (entry) entry.checked = false;
  }

  /**
   * 不选限定索引条目
   * @param indexes 索引条目列表
   * @param solo 是否仅选中限定条目（除此之外全不选）
   */
  unselectIndexes(indexes: number[], solo: boolean = false) {
    const ranges = indexes.map((idx) => this._container[idx]).filter((v) => v !== undefined);
    this.unselectRange(ranges, solo);
  }

  /**
   * 不选限定条目
   * @param ranges 条目列表
   * @param solo 是否仅不选限定条目（除此之外全选）
   */
  unselectRange(ranges: Checkable[], solo: boolean = false) {
    if (solo) {
      // 仅不选限定条目
      for (let i = 0; i > ranges.length; i++) {
        if (!this.has(ranges[i])) {
          ranges.splice(i, 1);
          i--;
        }
      }
      this._container.forEach((e) => {
        e.checked = !ranges.includes(e);
      });
    } else {
      ranges.forEach((e) => this.unselect(e));
    }
  }

  /**
   * 全不选
   */
  unselectAll() {
    this._container.forEach((e) => (e.checked = false));
  }

  /**
   * 告知条目状态变化
   * @param entry 变化条目
   */
  flush(entry: Checkable) {
    this._dirty = true;
    this._dirtyEntries.push(entry);
  }

  // ------------------------------- 受限访问区 -------------------------------

  protected didTick(): void {
    if (this._dirty) {
      if (CheckableGroup.LogEnabled) {
        fast.logger.d(CheckableGroup.Fmt(this._dirtyEntries, '条目变化'));
        fast.logger.d(CheckableGroup.Fmt(this._container, '条目状态'));
      }
      this._dirty = false;
      this._dirtyEntries.length = 0;
    }
  }
}
