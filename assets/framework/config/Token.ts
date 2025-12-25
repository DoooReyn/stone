/** 框架内置标识 */
export const PRESET_TOKEN = {
  /** 框架 */
  FAST: 'Fast',
  /** 应用 */
  APP: 'App',
  /** 参数解析器 */
  ARG_PARSER: 'ArgParser',
  /** 递增编号生成器 */
  ASCENDING_ID: 'AscendingId',
  /** 异常捕获 */
  CATCHER: 'Catcher',
  /** 事件总线 */
  EVENT_BUS: 'EventBus',
  /** 全局对象 */
  GLOBAL: 'Global',
  /** 国际化 */
  I18N: 'I18n',
  /** 节点池 */
  NODE_POOL: 'NodePool',
  /** 对象池 */
  OBJECT_POOL: 'ObjectPool',
  /** 性能分析器 */
  PROFILER: 'Profiler',
  /** 红点 */
  RED: 'Red',
  /** 敏感词过滤器 */
  SENSITIVE: 'Sensitive',
  /** 本地存储 */
  STORAGE: 'Storage',
  /** 配置表查询器 */
  TABLE_QUERY: 'TableQuery',
  /** 定时器 */
  TIMER: 'Timer',
} as const;
