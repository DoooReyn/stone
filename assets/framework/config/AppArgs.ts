import { sys } from 'cc';

/** 框架内置应用启动参数 */
export const PRESET_APP_ARGS = {
  appName: 'Stone',
  env: 'dev',
  languages: [sys.Language.CHINESE, sys.Language.ENGLISH],
} as const;
