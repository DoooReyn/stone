import { _decorator } from 'cc';

import { CheckBox } from './CheckBox';
import { Gem } from './Gem';

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
  public get size() {
    return this._container.length;
  }

  /**
   * 是否包含指定条目
   * @param entry 条目
   * @returns
   */
  public has(entry: CheckBox) {
    return this.indexOf(entry) > -1;
  }

  /**
   * 获取指定条目的索引
   * @param entry 条目
   * @returns
   */
  public indexOf(entry: CheckBox) {
    return this._container.indexOf(entry);
  }

  /**
   * 新增条目
   * @param entry 条目
   */
  public add(entry: CheckBox) {
    !this.has(entry) && this._container.push(entry);
  }

  /**
   * 移除条目
   * @param entry 条目
   */
  public remove(entry: CheckBox) {
    const index = this.indexOf(entry);
    if (index > -1) this._container.splice(index, 1);
  }

  /**
   * 清空条目
   */
  public clear() {
    this._container.length = 0;
  }

  /**
   * 选中条目
   * @param entry 当前条目
   */
  public select(entry: CheckBox) {
    if (this.has(entry)) {
      this._select(entry);
    }
  }

  /**
   * 选中索引条目
   * @param index 索引
   */
  public selectIndex(index: number) {
    this._select(this._container[index]);
  }

  /**
   * 选中限定索引条目
   * @param indexes 索引条目列表
   * @param solo 是否仅选中限定条目（除此之外全不选）
   */
  public selectIndexes(indexes: number[], solo: boolean = false) {
    const ranges = indexes.map((idx) => this._container[idx]).filter((v) => v !== undefined);
    this.selectRange(ranges, solo);
  }

  /**
   * 选中限定条目
   * @param ranges 条目列表
   * @param solo 是否仅选中限定条目（除此之外全不选）
   */
  public selectRange(ranges: CheckBox[], solo: boolean = false) {
    // 去除无效条目
    for (let i = 0; i < ranges.length; i++) {
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
  public selectAll() {
    this._container.forEach(this._select, this);
  }

  /**
   * 反选
   */
  public selectInvert() {
    this._container.forEach(this._next, this);
  }

  /**
   * 不选条目
   * @param entry 当前条目
   */
  public unselect(entry: CheckBox) {
    if (this.has(entry)) {
      this._unselect(entry);
    }
  }

  /**
   * 不选索引条目
   * @param index
   */
  public unselectIndex(index: number) {
    this._unselect(this._container[index]);
  }

  /**
   * 不选限定索引条目
   * @param indexes 索引条目列表
   * @param solo 是否仅选中限定条目（除此之外全不选）
   */
  public unselectIndexes(indexes: number[], solo: boolean = false) {
    const ranges = indexes.map((idx) => this._container[idx]).filter((v) => v !== undefined);
    this.unselectRange(ranges, solo);
  }

  /**
   * 不选限定条目
   * @param ranges 条目列表
   * @param solo 是否仅不选限定条目（除此之外全选）
   */
  public unselectRange(ranges: CheckBox[], solo: boolean = false) {
    // 去除无效条目
    for (let i = 0; i < ranges.length; i++) {
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
  public unselectAll() {
    this._container.forEach(this._unselect, this);
  }

  /**
   * 告知条目状态变化
   * @param entry 变化条目
   */
  public flush(entry: CheckBox) {
    entry.checked = !entry.checked;
    this._dirty = true;
    this._dirtyEntries.push(entry);
  }

  /** 选中的条目列表 */
  public get selected() {
    return this._container.filter((e) => e.checked);
  }

  /** 选中的索引条目列表 */
  public get selectedIndexes() {
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
        this.logger.d(
          '条目变化\n',
          this._dirtyEntries.map((e) => `${e.gName}:${e.checked ? '选中' : '未选中'}`).join('\n '),
        );
      }
      this._dirty = false;
      this._dirtyEntries.length = 0;
    }
  }
}
