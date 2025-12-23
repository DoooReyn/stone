import { PRESET_TOKEN } from 'fast/config/Token';
import { fast } from 'fast/Fast';
import { IObjectPoolPlugin } from 'fast/plugin/pool/IObjectPoolPlugin';

import { Option, SelectMode } from './Option';

/**
 * 选择器
 * - 支持单选和多选
 */
export class Selector<R> {
  /** 选项列表 */
  private _options: Option<R>[] = [];

  /**
   * 构造
   * @param type 选择模式
   */
  constructor(public readonly type: SelectMode) {}

  /** 对象池 */
  private get _pool() {
    return fast.acquire<IObjectPoolPlugin>(PRESET_TOKEN.OBJECT_POOL);
  }

  /**
   * 查询选项
   * @param raw 原始内容
   * @returns
   */
  public has(raw: R) {
    return this.findIndex(raw) > -1;
  }

  /**
   * 查询选项
   * @param raw 原始内容
   * @returns
   */
  public findIndex(raw: R) {
    return this._options.findIndex((v) => v.equals(raw));
  }

  /**
   * 查询选项
   * @param raw 原始内容
   * @returns
   */
  public find(raw: R) {
    return this._options.find((v) => v.equals(raw));
  }

  /**
   * 遍历选项
   * @param visit 访问器
   */
  public forEach(visit: (opt: Option<R>) => void) {
    this._options.forEach(visit);
  }

  /**
   * 添加选项
   * @param raw 原始内容
   */
  public add(raw: R) {
    if (!this.has(raw)) {
      const option = this._pool.acquire(Option<R>, raw)!;
      this._options.push(option);
      return option;
    }
    return null;
  }

  /**
   * 删除选项
   * @param raw 原始内容
   */
  public del(raw: R) {
    const objectPool = this._pool;
    const index = this.findIndex(raw);
    if (index > -1) {
      const options = this._options.splice(index, 1);
      if (options.length > 0) {
        objectPool.recycle(options[0]);
      }
    }
  }

  /** 清除选项 */
  public clear() {
    const objectPool = this._pool;
    for (let l = this._options.length, i = l - 1; i >= 0; i--) {
      objectPool.recycle(this._options[i]);
    }
    this._options.length = 0;
  }

  /**
   * 选中选项
   * @param raw 原始内容
   * @returns
   */
  public select(raw: R) {
    if (this._options.length == 0) return;
    if (!this.has(raw)) return;

    if (this.type === SelectMode.Single) {
      for (let i = 0, l = this._options.length, opt: Option<R>; i < l; i++) {
        opt = this._options[i];
        opt.selected = opt.equals(raw);
      }
    } else {
      const option = this.find(raw)!;
      option.selected = true;
    }
  }

  /**
   * 切换选项状态
   * @param option 选项
   */
  public switch(raw: R) {
    if (this._options.length == 0) return;
    if (!this.has(raw)) return;

    if (this.type === SelectMode.Single) {
      for (let i = 0, l = this._options.length, opt: Option<R>; i < l; i++) {
        opt = this._options[i];
        opt.selected = !opt.selected;
      }
    } else {
      const option = this.find(raw)!;
      option.selected = !option.selected;
    }
  }

  /**
   * 全部选中
   */
  public selectAll() {
    for (let i = 0, l = this._options.length, opt: Option<R>; i < l; i++) {
      opt = this._options[i];
      opt.selected = true;
    }
  }

  /**
   * 全部取消选中
   */
  public unselectAll() {
    for (let i = 0, l = this._options.length, opt: Option<R>; i < l; i++) {
      opt = this._options[i];
      opt.selected = false;
    }
  }

  /**
   * 获取选中的选项
   */
  public get selected() {
    const selected = [];
    for (let i = 0, l = this._options.length, opt: Option<R>; i < l; i++) {
      opt = this._options[i];
      if (opt.selected) {
        selected.push(opt);
      }
    }
    return selected;
  }

  /**
   * 指定内容是否被选中
   * @param raw 原始内容
   * @returns
   */
  public contains(raw: R) {
    if (this.has(raw)) {
      return this.selected.includes(this.find(raw)!);
    } else {
      return false;
    }
  }

  /**
   * 获取选项数量
   */
  public get size() {
    return this._options.length;
  }
}
