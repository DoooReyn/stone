import { ObjectEntry } from 'fast/plugin/pool/ObjectEntry';

import { Triggers } from './Trigger';

/** 选择模式 */
export enum SelectMode {
  /** 单选 */
  Single,
  /** 多选 */
  Multi,
}

/**
 * 选项
 */
export class Option<R> extends ObjectEntry {
  /** 原始内容 */
  private _raw: R | null = null;

  /** 触发器#选择 */
  public readonly onSelected: Triggers = new Triggers();

  /** 选择状态 */
  private _status: boolean = false;

  /** 选择状态 */
  public get selected() {
    return this._status;
  }
  public set selected(sel: boolean) {
    if (this._status !== sel) {
      this._status = sel;
    }
    this.onSelected.runWith(sel, this._raw);
  }

  /** 设置选择状态，但是不触发事件 */
  public set selectedNoEmit(sel: boolean) {
    if (this._status !== sel) {
      this._status = sel;
    }
  }

  /** 是否同一选项 */
  public equals(raw: R) {
    return this._raw === raw;
  }

  onInitialize(raw: any) {
    this._raw = raw;
    this._status = false;
    this.onSelected.clear();
  }

  onRecycled() {
    this._raw = null;
    this._status = false;
    this.onSelected.clear();
  }
}
