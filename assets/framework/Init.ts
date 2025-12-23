import { GLOBALS } from './config';
import * as stone from './index';

export async function boot() {
  // 插件列表（按照依赖关系进行排序，无依赖的应该放在最前面）
  const plugins = [
    stone.GlobalPlugin, 
    stone.ObjectPoolPlugin, 
    stone.NodePoolPlugin
  ];

  // 注册插件
  for (const plugin of plugins) {
    stone.fast.register(plugin);
  }

  // 初始化插件（按顺序）
  for (const plugin of plugins) {
    await stone.fast.acquire(plugin.Token).initialize();
  }

  // 将 Fast 框架实例注册到全局变量中
  const gg = stone.fast.acquire<stone.IGlobal>(stone.TOKENS.GLOBAL);
  gg.set(GLOBALS.STONE, stone);
  gg.set(GLOBALS.FAST, stone.fast);

  stone.fast.logger.i('框架启动完成');
}
