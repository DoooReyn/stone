import { Constructor, Prefab } from 'cc';
import { IPlugin } from 'fast/foundation/Plugin';

import { IRecyclableNode, IRecyclableOptions } from './IRecycleable';
import { NodePool } from './NodePool';

/**
 * 节点池插件接口
 */
export interface INodePoolPlugin extends IPlugin {
  /**
   * 获取节点池
   * @param token 池子标记
   * @returns 节点池实例
   */
  poolOf(token: string): NodePool | undefined;

  /**
   * 通过构造函数注册节点池
   * @param template 节点构造函数
   * @param options 池子配置
   */
  registerByConstructor(template: Constructor<IRecyclableNode>, options: IRecyclableOptions): void;

  /**
   * 通过实例注册节点池
   * @param template 节点实例或预制体
   * @param options 池子配置
   */
  registerByInstance(template: Node | Prefab, options: IRecyclableOptions): void;

  /**
   * 注销节点池
   * @param token 池子标记
   */
  unregister(token: string): void;

  /**
   * 检查节点池是否存在
   * @param token 池子标记
   * @returns 是否存在
   */
  has(token: string): boolean;

  /**
   * 获取节点池模板
   * @param token 池子标记
   * @returns 模板实例
   */
  templateOf(token: string): Prefab | IRecyclableNode | undefined;

  /**
   * 从节点池获取实例
   * @param token 池子标记
   * @param args 初始化参数
   * @returns 节点实例
   */
  acquire<N extends IRecyclableNode>(token: string, ...args: any[]): N | undefined;

  /**
   * 回收节点实例到池子
   * @param inst 要回收的节点实例
   */
  recycle(inst: IRecyclableNode): void;

  /**
   * 获取节点池大小
   * @param token 池子标记
   * @returns 池子中的节点数量
   */
  sizeOf(token: string): number;

  /**
   * 清理所有池子中过期未使用的节点
   */
  clearUnused(): void;

  /**
   * 清空所有池子
   */
  clear(): void;
}
