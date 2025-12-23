import { Constructor, Prefab } from 'cc';
import { PRESET_TOKEN } from 'fast/config';
import { FastError } from 'fast/foundation/Error';
import { Plugin } from 'fast/foundation/Plugin';

import { INodePoolPlugin } from './INodePoolPlugin';
import { IRecyclableNode, IRecyclableOptions } from './IRecycleable';
import { NodePool } from './NodePool';

/**
 * 节点池容器服务
 */
export class NodePoolPlugin extends Plugin implements INodePoolPlugin {
  public static readonly Token = PRESET_TOKEN.NODE_POOL;

  /** 节点池容器 */
  private _container: Map<string, NodePool> = new Map();

  /**
   * 获取节点池
   * @param token 池子标记
   * @returns 节点池实例
   */
  poolOf(token: string): NodePool | undefined {
    return this._container.get(token);
  }

  /**
   * 通过构造函数注册节点池
   * @param template 节点构造函数
   * @param options 池子配置
   */
  registerByConstructor(template: Constructor<IRecyclableNode>, options: IRecyclableOptions): void {
    const token = options.token;
    if (this._container.has(token)) {
      throw new FastError(this.token, `节点池⁅${token}⁆重复注册`);
    }

    const pool = new NodePool(new template(), options);
    this._container.set(token, pool);
    pool.fill(options.expands);
  }

  /**
   * 通过实例注册节点池
   * @param template 节点实例或预制体
   * @param options 池子配置
   */
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

  /**
   * 注销节点池
   * @param token 池子标记
   */
  unregister(token: string): void {
    if (this._container.has(token)) {
      this._container.delete(token);
    }
  }

  /**
   * 检查节点池是否存在
   * @param token 池子标记
   * @returns 是否存在
   */
  has(token: string): boolean {
    return this._container.has(token);
  }

  /**
   * 获取节点池模板
   * @param token 池子标记
   * @returns 模板实例
   */
  templateOf(token: string): Prefab | IRecyclableNode | undefined {
    if (!this._container.has(token)) {
      throw new FastError(this.token, `节点池⁅${token}⁆未注册`);
    }

    const pool = this._container.get(token)!;
    return pool.template;
  }

  /**
   * 从节点池获取实例
   * @param token 池子标记
   * @param args 初始化参数
   * @returns 节点实例
   */
  acquire<N extends IRecyclableNode>(token: string, ...args: any[]): N | undefined {
    if (!this._container.has(token)) {
      throw new FastError(this.token, `节点池⁅${token}⁆未注册`);
    }

    const pool = this._container.get(token)!;
    return pool.acquire(...args) as N;
  }

  /**
   * 回收节点实例到池子
   * @param inst 要回收的节点实例
   */
  recycle(inst: IRecyclableNode): void {
    if (inst && inst.isValid && inst.token !== undefined && inst.recycledAt === 0) {
      if (!this._container.has(inst.token)) {
        throw new FastError(this.token, `节点池⁅${inst.token}⁆未注册`);
      }

      this._container.get(inst.token)!.recycle(inst);
      this.logger.d(`节点池⁅${inst.token}⁆已回收节点⁅${inst.name}⁆`);
    }
  }

  /**
   * 获取节点池大小
   * @param token 池子标记
   * @returns 池子中的节点数量
   */
  sizeOf(token: string): number {
    if (this._container.has(token)) {
      return this._container.get(token)!.size;
    }

    return 0;
  }

  /**
   * 清理所有池子中过期未使用的节点
   */
  clearUnused(): void {
    this._container.forEach((v) => v.clearUnused());
  }

  /**
   * 清空所有池子
   */
  clear(): void {
    this._container.forEach((pool) => pool.clear());
  }
}
