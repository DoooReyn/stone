import { IRecyclableOptions } from '../plugin/pool/IRecycleable';

/**
 * 框架内置对象池回收配置
 */
export const PRESET_OBJECT_POOL: {
  MODEL: IRecyclableOptions;
  TRIGGER: IRecyclableOptions;
  OPTION: IRecyclableOptions;
  COUNTER: IRecyclableOptions;
} = {
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
