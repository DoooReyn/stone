import { IRecyclableOptions } from 'fast/plugin/pool/IRecycleable';

/**
 * 框架内置对象池回收配置接口
 */
export interface IObjectPoolPreset {
  /** 模型对象池配置 */
  MODEL: IRecyclableOptions;
  /** 触发器对象池配置 */
  TRIGGER: IRecyclableOptions;
  /** 选项对象池配置 */
  OPTION: IRecyclableOptions;
  /** 计数器对象池配置 */
  COUNTER: IRecyclableOptions;
}

/**
 * 框架内置对象池回收配置
 */
export const PRESET_OBJECT_POOL: IObjectPoolPreset = {
  MODEL: {
    token: 'Model',
    capacity: 0,
    expands: 8,
    expires: 120_000,
  },
  TRIGGER: {
    token: 'Trigger',
    capacity: 0,
    expands: 8,
    expires: 120_000,
  },
  OPTION: {
    token: 'Option',
    capacity: 0,
    expands: 4,
    expires: 30_000,
  },
  COUNTER: {
    token: 'Counter',
    capacity: 0,
    expands: 4,
    expires: 30_000,
  },
} as const;
