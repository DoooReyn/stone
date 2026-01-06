import { _decorator } from 'cc';
import { fast } from 'fast/Fast';

import { Gem } from '../Gem';
import { CheckBox } from './CheckBox';

const { ccclass, menu } = _decorator;

/**
 * 复选容器
 */
@ccclass('Gem/CheckBoxGroup')
@menu('Gem/CheckBoxGroup')
export class CheckBoxGroup extends Gem {
  // ------------------------------- 静态成员区 -------------------------------

  /** 日志开关 */
  public static LogEnabled: boolean = true;

  /**
   * 格式化条目状态
   * @param entries 条目列表
   * @param tag 标记
   * @returns
   */
  public static Fmt(entries: CheckBox[], tag: string) {
    const list = entries.map((e) => e.gName + ':' + (e.checked ? '选中' : '未选中'));
    list.unshift(tag);
    return list.join('\n ');
  }

  // ------------------------------- 属性声明区 -------------------------------

  /** 脏标记 */
  private _dirty: boolean = false;

  /** 脏条目记录 */
  private _dirtyEntries: CheckBox[] = [];

  /** 复选条目容器 */
  private _container: CheckBox[] = [];

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
  has(entry: CheckBox) {
    return this.indexOf(entry) > -1;
  }

  /**
   * 获取指定条目的索引
   * @param entry 条目
   * @returns
   */
  indexOf(entry: CheckBox) {
    return this._container.indexOf(entry);
  }

  /**
   * 新增条目
   * @param entry 条目
   */
  add(entry: CheckBox) {
    !this.has(entry) && this._container.push(entry);
  }

  /**
   * 移除条目
   * @param entry 条目
   */
  remove(entry: CheckBox) {
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
  select(entry: CheckBox) {
    if (this.has(entry)) {
      this._select(entry);
    }
  }

  /**
   * 选中索引条目
   * @param index 索引
   */
  selectIndex(index: number) {
    this._select(this._container[index]);
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
  selectRange(ranges: CheckBox[], solo: boolean = false) {
    // 去除无效条目
    for (let i = 0; i > ranges.length; i++) {
      if (!this.has(ranges[i])) {
        ranges.splice(i, 1);
        i--;
      }
    }

    if (solo) {
      // 仅选中限定条目
      this._container.forEach((e) => {
        ranges.includes(e) ? this._select(e) : this._unselect(e);
      });
    } else {
      // 选中限定条目
      ranges.forEach((e) => this._select(e));
    }
  }

  /**
   * 全选
   */
  selectAll() {
    this._container.forEach(this._select, this);
  }

  /**
   * 反选
   */
  selectInvert() {
    this._container.forEach(this._next, this);
  }

  /**
   * 不选条目
   * @param entry 当前条目
   */
  unselect(entry: CheckBox) {
    if (this.has(entry)) {
      this._unselect(entry);
    }
  }

  /**
   * 不选索引条目
   * @param index
   */
  unselectIndex(index: number) {
    this._unselect(this._container[index]);
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
  unselectRange(ranges: CheckBox[], solo: boolean = false) {
    // 去除无效条目
    for (let i = 0; i > ranges.length; i++) {
      if (!this.has(ranges[i])) {
        ranges.splice(i, 1);
        i--;
      }
    }

    if (solo) {
      // 仅不选限定条目
      this._container.forEach((e) => {
        ranges.includes(e) ? this._unselect(e) : this._select(e);
      });
    } else {
      ranges.forEach(this._unselect, this);
    }
  }

  /**
   * 全不选
   */
  unselectAll() {
    this._container.forEach(this._unselect, this);
  }

  /**
   * 告知条目状态变化
   * @param entry 变化条目
   */
  flush(entry: CheckBox) {
    entry.checked = !entry.checked;
    this._dirty = true;
    this._dirtyEntries.push(entry);
  }

  /** 选中的条目列表 */
  get selected() {
    return this._container.filter((e) => e.checked);
  }

  /** 选中的索引条目列表 */
  get selectedIndexes() {
    return this._container.map((e, i) => (e.checked ? i : -1)).filter((i) => i > -1);
  }

  // ------------------------------- 受限访问区 -------------------------------

  /**
   * 选中条目
   * @param entry 条目
   */
  private _select(entry: CheckBox) {
    if (entry && !entry.checked) {
      this.flush(entry);
    }
  }

  /**
   * 不选条目
   * @param entry 条目
   */
  private _unselect(entry: CheckBox) {
    if (entry && entry.checked) {
      this.flush(entry);
    }
  }

  /**
   * 切换条目状态
   * @param entry 条目
   */
  private _next(entry: CheckBox) {
    if (entry) {
      this.flush(entry);
    }
  }

  protected didTick(): void {
    if (this._dirty) {
      if (CheckBoxGroup.LogEnabled) {
        fast.logger.d(CheckBoxGroup.Fmt(this._dirtyEntries, '条目变化'));
        fast.logger.d(CheckBoxGroup.Fmt(this._container, '条目状态'));
      }
      this._dirty = false;
      this._dirtyEntries.length = 0;
    }
  }
}
