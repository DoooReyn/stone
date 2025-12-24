import { PRESET_EVENT_NAME } from 'fast/config/Event';
import { PRESET_TOKEN } from 'fast/config/Token';
import { Plugin } from 'fast/foundation/Plugin';

import { IEventBusPlugin } from '../event-bus/IEventBusPlugin';
import { IStoragePlugin } from '../storage/IStoragePlugin';
import { IRedChangeEvent, IRedConfig, IRedData, IRedPlugin, IRedPool } from './IRedPlugin';

/**
 * 红点池
 */
class RedPool implements IRedPool {
  /** 红点对象容器 */
  private _container: IRedData[] = [];
  /** 红点对象池最大容量 */
  private _maxSize: number = 128;

  acquire(): IRedData {
    if (this._container.length > 0) {
      const red = this._container.pop()!;
      red.data = undefined;
      red.visible = false;
      red.updateTime = 0;
      return red;
    }
    return {
      data: undefined,
      visible: false,
      updateTime: Date.now(),
    };
  }

  recycle(red: IRedData): void {
    if (this._container.length < this._maxSize) {
      this._container.push(red);
    }
  }
}

/**
 * 红点插件
 */
export class RedPlugin extends Plugin implements IRedPlugin {
  static readonly Token: string = PRESET_TOKEN.RED;

  /** 红点配置映射 */
  private _configs: Map<string, IRedConfig> = new Map();
  /** 红点数据映射 */
  private _reds: Map<string, IRedData> = new Map();
  /** 状态监听器映射 */
  private _listeners: Map<string, Set<(event: IRedChangeEvent) => void>> = new Map();
  /** 红点对象池 */
  private _pool: IRedPool = new RedPool();
  /** 批量更新队列 */
  private _batchQueue: { id: string; data: any }[] = [];
  /** 是否正在批量更新 */
  private _isBatching: boolean = false;

  protected readonly $dependencies: string[] = [PRESET_TOKEN.EVENT_BUS, PRESET_TOKEN.STORAGE];

  /**
   * 注册红点配置
   * @param config 红点配置
   */
  register(config: IRedConfig): void {
    if (this._configs.has(config.id)) {
      this.logger.e(`红点 ⁅${config.id}⁆ 注册失败，目标已存在`);
      return;
    }

    this._configs.set(config.id, config);

    // 初始化红点数据
    const red = this._pool.acquire();
    red.updateTime = Date.now();

    // 如果支持持久化，尝试恢复本地数据
    if (config.persistent) {
      this.loadFromStorage(config.id, red);
    }

    this._reds.set(config.id, red);

    // 处理父子关系
    if (config.parent) {
      const parentConfig = this._configs.get(config.parent);
      if (parentConfig) {
        if (!parentConfig.children) {
          parentConfig.children = [];
        }
        if (!parentConfig.children.includes(config.id)) {
          parentConfig.children.push(config.id);
        }
      }
    }

    this.logger.d(`红点 ⁅${config.id}⁆ 已注册`);
  }

  /**
   * 更新红点数据
   * @param id 红点ID
   * @param data 红点数据
   */
  updateData(id: string, data: any): void {
    const config = this._configs.get(id);
    if (!config) {
      this.logger.e(`红点 ⁅${id}⁆ 更新失败，目标未注册`);
      return;
    }

    const red = this._reds.get(id);
    if (!red) {
      this.logger.e(`红点 ⁅${id}⁆ 更新失败，数据为空`);
      return;
    }

    // 更新数据
    red.data = data;
    red.updateTime = Date.now();

    // 评估新状态
    const newVisible = config.rule.evaluate(data);

    if (red.visible !== newVisible) {
      red.visible = newVisible;

      // 触发状态变化事件
      this.emitChangeEvent(id, newVisible, data);

      // 更新父红点状态
      this.updateParentState(id);

      // 持久化处理
      if (config.persistent) {
        this.saveToStorage(id, red);
      }
    }
  }

  /**
   * 获取红点状态
   * @param id 红点ID
   * @returns 是否显示红点
   */
  getState(id: string): boolean {
    const red = this._reds.get(id);
    return red ? red.visible : false;
  }

  /**
   * 获取红点数据
   * @param id 红点ID
   * @returns 红点状态数据
   */
  getData(id: string): IRedData | null {
    const red = this._reds.get(id);
    return red ? { ...red } : null;
  }

  /**
   * 监听红点状态变化
   * @param id 红点ID
   * @param callback 状态变化回调
   * @returns 取消监听的函数
   */
  subscribe(id: string, callback: (event: IRedChangeEvent) => void): () => void {
    if (!this._listeners.has(id)) {
      this._listeners.set(id, new Set());
    }

    this._listeners.get(id)!.add(callback);

    // 返回取消监听的函数
    return () => {
      this.unsubscribe(id, callback);
    };
  }

  /**
   * 取消监听红点状态变化
   * @param id 红点ID
   * @param callback 状态变化回调
   */
  unsubscribe(id: string, callback: (event: IRedChangeEvent) => void): void {
    const listeners = this._listeners.get(id);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this._listeners.delete(id);
      }
    }
  }

  /**
   * 批量更新红点数据
   * @param updates 批量更新数据
   */
  batchUpdate(updates: { id: string; data: any }[]): void {
    const changedEvents: IRedChangeEvent[] = [];
    const parentIdsToUpdate = new Set<string>();

    this._isBatching = true;

    try {
      updates.forEach((update) => {
        const config = this._configs.get(update.id);
        if (!config) {
          this.logger.e(`红点 ⁅${update.id}⁆ 更新失败，目标未注册`);
          return;
        }

        const red = this._reds.get(update.id);
        if (!red) {
          this.logger.e(`红点 ⁅${update.id}⁆ 更新失败，数据为空`);
          return;
        }

        // 更新数据
        red.data = update.data;
        red.updateTime = Date.now();

        // 评估新状态
        const newVisible = config.rule.evaluate(update.data);

        if (red.visible !== newVisible) {
          red.visible = newVisible;

          // 收集状态变化事件，稍后批量触发
          changedEvents.push({ id: update.id, visible: newVisible, data: update.data });

          // 收集需要更新的父红点ID
          if (config.parent) {
            parentIdsToUpdate.add(config.parent);
          }

          // 持久化处理
          if (config.persistent) {
            this.saveToStorage(update.id, red);
          }
        }
      });

      // 批量更新父红点状态
      parentIdsToUpdate.forEach((parentId) => {
        this.updateParentState(parentId);
      });

      // 批量触发状态变化事件
      changedEvents.forEach((event) => {
        this.__notifyListeners(event);
        this.notifyEventBus(event);
      });
    } finally {
      this._isBatching = false;
    }
  }

  /**
   * 清除红点状态
   * @param id 红点ID
   */
  clear(id: string): void {
    const config = this._configs.get(id);
    if (!config) return;

    const red = this._reds.get(id);
    if (!red) {
      return;
    }

    red.visible = false;
    red.data = undefined;
    red.updateTime = Date.now();

    // 触发状态变化事件
    this.emitChangeEvent(id, false, undefined);

    // 更新父红点状态
    this.updateParentState(id);

    // 持久化处理
    if (config.persistent) {
      this.saveToStorage(id, red);
    }
  }

  /**
   * 触发红点点击事件
   * @param id 红点ID
   */
  onClick(id: string): void {
    const config = this._configs.get(id);
    if (!config) {
      this.logger.e(`红点 ⁅${id}⁆ 触发失败，目标未注册`);
      return;
    }

    // 自动清除处理
    if (config.autoClear) {
      this.clear(id);
    }
  }

  /**
   * 获取所有红点状态
   * @returns 所有红点状态映射
   */
  getAllStates(): Map<string, IRedData> {
    const result = new Map<string, IRedData>();
    this._reds.forEach((red, id) => {
      result.set(id, { ...red });
    });
    return result;
  }

  /**
   * 检查红点是否存在
   * @param id 红点ID
   * @returns 是否存在
   */
  has(id: string): boolean {
    return this._configs.has(id);
  }

  /**
   * 注销红点
   * @param id 红点ID
   */
  unregister(id: string): void {
    const config = this._configs.get(id);
    if (!config) {
      return;
    }

    // 清理子红点的父引用
    if (config.children) {
      config.children.forEach((childId) => {
        const childConfig = this._configs.get(childId);
        if (childConfig) {
          childConfig.parent = undefined;
        }
      });
    }

    // 清理父红点的子引用
    if (config.parent) {
      const parentConfig = this._configs.get(config.parent);
      if (parentConfig && parentConfig.children) {
        const index = parentConfig.children.indexOf(id);
        if (index !== -1) {
          parentConfig.children.splice(index, 1);
        }
      }
    }

    // 释放红点对象
    const red = this._reds.get(id);
    if (red) {
      this._pool.recycle(red);
      this._reds.delete(id);
    }

    // 清理监听器
    this._listeners.delete(id);

    // 删除配置
    this._configs.delete(id);

    this.logger.i(`红点 ⁅${id}⁆ 已注销`);
  }

  /**
   * 触发状态变化事件
   * @param id 红点ID
   * @param visible 是否可见
   * @param data 红点数据
   */
  private emitChangeEvent(id: string, visible: boolean, data?: any): void {
    const event: IRedChangeEvent = { id, visible, data };

    // 如果不是批量更新模式，立即触发事件
    if (!this._isBatching) {
      this.__notifyListeners(event);
      this.notifyEventBus(event);
    }
  }

  /**
   * 通知监听器
   * @param event 状态变化事件
   */
  private __notifyListeners(event: IRedChangeEvent): void {
    const listeners = this._listeners.get(event.id);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          this.logger.e(`红点 ⁅${event.id}⁆ 状态切换异常`, error);
        }
      });
    }
  }

  /**
   * 通知事件总线
   * @param event 状态变化事件
   */
  private notifyEventBus(event: IRedChangeEvent): void {
    this.of<IEventBusPlugin>(PRESET_TOKEN.EVENT_BUS).red.emit(PRESET_EVENT_NAME.RED_STATE_CHANGED + event.id, event);
  }

  /**
   * 更新父红点状态
   * @param childId 子红点ID
   */
  private updateParentState(childId: string): void {
    const config = this._configs.get(childId);
    if (!config || !config.parent) {
      return;
    }

    const parentConfig = this._configs.get(config.parent);
    if (!parentConfig || !parentConfig.children) {
      return;
    }

    // 计算父红点状态（任一子红点可见则父红点可见）
    let parentVisible = false;
    for (const childId of parentConfig.children) {
      const childRed = this._reds.get(childId);
      if (childRed && childRed.visible) {
        parentVisible = true;
        break;
      }
    }

    const parentRed = this._reds.get(config.parent);
    if (parentRed && parentRed.visible !== parentVisible) {
      parentRed.visible = parentVisible;
      parentRed.updateTime = Date.now();

      // 触发父红点状态变化事件
      this.emitChangeEvent(config.parent, parentVisible, parentRed.data);

      // 递归更新祖父红点
      this.updateParentState(config.parent);
    }
  }

  /**
   * 从本地存储加载红点数据
   * @param id 红点ID
   * @param data 红点数据对象
   */
  private loadFromStorage(id: string, data: IRedData): void {
    const store = this.of<IStoragePlugin>(PRESET_TOKEN.STORAGE);
    try {
      const key = `red:${id}`;
      store.load(key);
      const storeItem = store.itemOf(key);
      if (storeItem && storeItem.data) {
        this.updateData(id, storeItem.data);
        this.logger.d(`红点 ⁅${id}⁆ 数据已恢复`);
      }
    } catch (error) {
      this.logger.e(`红点 ⁅${id}⁆ 数据恢复异常`, error);
    }
  }

  /**
   * 保存红点数据到本地存储
   * @param id 红点ID
   * @param red 红点数据
   */
  private saveToStorage(id: string, red: IRedData): void {
    try {
      const storage = this.of<IStoragePlugin>(PRESET_TOKEN.STORAGE);
      const storeItem = storage.itemOf(`red:${id}`);
      if (storeItem) {
        storeItem.data.visible = red.visible;
        storeItem.data.data = red.data;
        storeItem.data.updateTime = red.updateTime;
        storeItem.save();
        this.logger.df(`红点 ⁅${id}⁆ 数据已保存`);
      }
    } catch (error) {
      this.logger.ef(`红点 ⁅${id}⁆ 数据保存异常`, error);
    }
  }

  public destroy() {
    this._configs.clear();
    this._reds.clear();
    this._listeners.clear();
    this._batchQueue.length = 0;
  }
}
