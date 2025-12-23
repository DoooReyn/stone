import { instantiate, Prefab } from 'cc';
import { time } from 'fast/util';

import { IRecyclableNode, IRecyclableOptions } from './IRecycleable';

/**
 * 节点池
 */
export class NodePool {
  /** 节点列表 */
  private _container: IRecyclableNode[] = [];

  /**
   * 构造函数
   * @param template 模板（预制体或节点实例）
   * @param options 选项
   */
  public constructor(public readonly template: Prefab | IRecyclableNode, public readonly options: IRecyclableOptions) {}

  /** 标识 */
  get token() {
    return this.options.token;
  }

  /** 过期时间 */
  get expires() {
    return this.options.expires;
  }

  /** 扩容数量 */
  get expands() {
    return this.options.expands;
  }

  /** 容量限制 */
  get capacity() {
    return this.options.capacity;
  }

  /** 当前数量 */
  get size(): number {
    return this._container.length;
  }

  /**
   * 填充池子
   * @param n 目标数量
   */
  fill(n: number): void {
    if (n == undefined || n <= 0 || this.size >= n) return;

    const need = n - this.size;
    for (let i = 0; i < need; i++) {
      this._container.push(instantiate(this.template) as IRecyclableNode);
    }
  }

  /**
   * 获取节点实例
   * @param args 初始化参数
   * @returns 节点实例
   */
  acquire(...args: any[]): IRecyclableNode | undefined {
    const node: IRecyclableNode =
      this.size > 0 ? this._container.shift()! : (instantiate(this.template) as IRecyclableNode);
    node.token = this.options.token;
    node.createdAt = 0;
    node.recycledAt = 0;
    node.onInitialize(...args);

    if (this.size == 0 && this.options.expands > 0) {
      setTimeout(() => this.fill(this.options.expands), 0);
    }

    return node;
  }

  /**
   * 回收节点实例
   * @param inst 要回收的节点实例
   */
  recycle(inst: IRecyclableNode): void {
    if (inst && inst.isValid && inst.recycledAt === 0) {
      const capacity = this.capacity;
      const size = this.size;
      inst.createdAt = 0;
      inst.recycledAt = time.now();
      inst.onRecycled();
      if (capacity <= 0 || size < capacity) {
        inst.removeFromParent();
        // 延迟回收，防止同一时间被回收又被取出使用可能引起不必要的麻烦
        setTimeout(() => this._container.push(inst), 0);
      } else {
        inst.destroy();
      }
    }
  }

  /**
   * 清理过期未使用的节点
   */
  clearUnused(): void {
    const expires = this.expires;
    if (expires <= 0) return;

    const expands = this.options.expands;
    if (this.size <= expands) return;

    for (let i = this.size - 1 - expands; i >= 0; i--) {
      this._container[i].destroy();
      this._container.splice(i, 1);
    }
  }

  /**
   * 清空池子中的所有节点
   */
  clear(): void {
    for (let i = this.size - 1; i >= 0; i--) {
      this._container[i].destroy();
      this._container.splice(i, 1);
    }
  }
}
