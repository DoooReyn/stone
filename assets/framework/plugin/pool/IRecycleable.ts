import { Node } from 'cc';

/**
 * 可回收配置
 */
export interface IRecyclableOptions {
  /** 标记 */
  token: string;
  /** 容量（允许池子持有的数量，小于0表示不限制） */
  capacity: number;
  /** 扩容数量（每次自动扩容的数量，小于0表示禁止自动扩容） */
  expands: number;
  /** 过期时间（毫秒）（超时后会被池子丢弃） */
  expires: number;
}

/**
 * 可回收对象
 */
export interface IRecyclableObject {
  /**
   * 标记
   * @notes 请勿手动修改
   */
  token: string;
  /**
   * 创建时间
   * @notes 请勿手动修改
   */
  createdAt: number;
  /**
   * 回收时间
   * @notes 请勿手动修改
   */
  recycledAt: number;
}

/**
 * 可回收节点
 */
export interface IRecyclableNode extends Node {
  /**
   * 标记
   * @notes 请勿手动修改
   */
  token: string;
  /**
   * 创建时间
   * @notes 请勿手动修改
   */
  createdAt: number;
  /**
   * 回收时间
   * @notes 请勿手动修改
   */
  recycledAt: number;
  /**
   * 初始化
   * @note 请勿手动调用
   * @param args 初始化参数
   */
  initialize(...args: any[]): void;
  /**
   * 回收回调
   * @note 请勿手动调用
   */
  recycle(): void;
}
