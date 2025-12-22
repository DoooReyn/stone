import { instantiate, Constructor, Prefab } from 'cc';

import { FastError } from '../../Error';
import { Plugin } from '../../Plugin';
import { time } from '../../util';
import { IRecyclableNode, IRecyclableOptions } from './IRecycleable';

/**
 * 节点池
 */
export class NodePool {
  /** 节点列表 */
  private _items: IRecyclableNode[] = [];

  public constructor(public readonly template: Prefab | IRecyclableNode, public readonly options: IRecyclableOptions) {}

  get token() {
    return this.options.token;
  }

  get expires() {
    return this.options.expires;
  }

  get expands() {
    return this.options.expands;
  }

  get capacity() {
    return this.options.capacity;
  }

  get size(): number {
    return this._items.length;
  }

  fill(n: number): void {
    if (n == undefined || n <= 0 || this.size >= n) return;

    const need = n - this.size;
    for (let i = 0; i < need; i++) {
      this._items.push(instantiate(this.template) as IRecyclableNode);
    }
  }

  acquire(...args: any[]): IRecyclableNode | undefined {
    const node: IRecyclableNode =
      this.size > 0 ? this._items.shift()! : (instantiate(this.template) as IRecyclableNode);
    node.token = this.options.token;
    node.createdAt = 0;
    node.recycledAt = 0;
    node.onInitialize(...args);

    if (this.size == 0 && this.options.expands > 0) {
      setTimeout(() => this.fill(this.options.expands), 0);
    }

    return node;
  }

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
        setTimeout(() => this._items.push(inst), 0);
      } else {
        inst.destroy();
      }
    }
  }

  clearUnused(): void {
    const expires = this.expires;
    if (expires <= 0) return;

    const expands = this.options.expands;
    if (this.size <= expands) return;

    for (let i = this.size - 1 - expands; i >= 0; i--) {
      this._items[i].destroy();
      this._items.splice(i, 1);
    }
  }

  clear(): void {
    for (let i = this.size - 1; i >= 0; i--) {
      this._items[i].destroy();
      this._items.splice(i, 1);
    }
  }
}

/**
 * 节点池容器服务
 */
export class NodePoolPlugin extends Plugin {
  public static readonly Token: string = 'NodePool';

  /** 节点池容器 */
  private _container: Map<string, NodePool> = new Map();

  poolOf(token: string): NodePool | undefined {
    return this._container.get(token);
  }

  registerByConstructor(template: Constructor<IRecyclableNode>, options: IRecyclableOptions): void {
    const token = options.token;
    if (this._container.has(token)) {
      throw new FastError(this.token, `节点池⁅${token}⁆重复注册`);
    }

    const pool = new NodePool(new template(), options);
    this._container.set(token, pool);
    pool.fill(options.expands);
  }

  registerByInstance(template: Node | Prefab, options: IRecyclableOptions): void {
    const token = options.token;
    if (this._container.has(token)) {
      throw new FastError(this.token, `节点池⁅${token}⁆重复注册`);
    }

    if (template instanceof Node) {
      const node = template as Node & { createdAt?: Number; recycledAt?: Number; token?: string };
      if (node.token === undefined || (typeof node.token === 'string' && !this.has(node.token!))) {
        node.createdAt = 0;
        node.recycledAt = 0;
        node.token = token;
        const pool = new NodePool(node as unknown as IRecyclableNode, options);
        this._container.set(token, pool);
        pool.fill(options.expands);
      } else {
        throw new FastError(this.token, `节点池⁅${token}⁆注册失败，不匹配的模板`);
      }
    } else {
      const pool = new NodePool(template, options);
      this._container.set(token, pool);
      pool.fill(options.expands);
    }
  }

  unregister(token: string): void {
    if (this._container.has(token)) {
      this._container.delete(token);
    }
  }

  has(token: string): boolean {
    return this._container.has(token);
  }

  templateOf(token: string): Prefab | IRecyclableNode | undefined {
    if (!this._container.has(token)) {
      throw new FastError(this.token, `节点池⁅${token}⁆未注册`);
    }

    const pool = this._container.get(token)!;
    return pool.template;
  }

  acquire<N extends IRecyclableNode>(token: string, ...args: any[]): N | undefined {
    if (!this._container.has(token)) {
      throw new FastError(this.token, `节点池⁅${token}⁆未注册`);
    }

    const pool = this._container.get(token)!;
    return pool.acquire(...args) as N;
  }

  recycle(inst: IRecyclableNode): void {
    if (inst && inst.isValid && inst.token !== undefined && inst.recycledAt === 0) {
      if (!this._container.has(inst.token)) {
        throw new FastError(this.token, `节点池⁅${inst.token}⁆未注册`);
      }

      this._container.get(inst.token)!.recycle(inst);
      this.logger.d(`节点池⁅${inst.token}⁆已回收节点⁅${inst.name}⁆`);
    }
  }

  sizeOf(token: string): number {
    if (this._container.has(token)) {
      return this._container.get(token)!.size;
    }

    return 0;
  }

  clearUnused(): void {
    this._container.forEach((v) => v.clearUnused());
  }

  clear(): void {
    this._container.forEach((pool) => pool.clear());
  }
}
