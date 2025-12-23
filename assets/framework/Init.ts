import { PRESET_GLOBAL } from './config/Global';
import * as stone from './index';

export async function boot() {
  // 插件列表（按照依赖关系进行排序，无依赖的应该放在最前面）
  const plugins = [stone.GlobalPlugin, stone.ObjectPoolPlugin, stone.NodePoolPlugin];

  // 注册插件
  for (const plugin of plugins) {
    stone.fast.register(plugin);
  }

  // 初始化插件（按顺序）
  for (const plugin of plugins) {
    await stone.fast.acquire(plugin.Token).initialize();
  }

  // 注册对象池
  const objectPool = stone.fast.acquire<stone.IObjectPoolPlugin>(stone.PRESET_TOKEN.OBJECT_POOL);
  objectPool.register(stone.Trigger, stone.PRESET_OBJECT_POOL.TRIGGER);
  objectPool.register(stone.Option, stone.PRESET_OBJECT_POOL.OPTION);
  objectPool.register(stone.Counter, stone.PRESET_OBJECT_POOL.COUNTER);
  objectPool.register(stone.Model, stone.PRESET_OBJECT_POOL.MODEL);

  // 将 Fast 框架实例注册到全局变量中
  const gg = stone.fast.acquire<stone.IGlobalPlugin>(stone.PRESET_TOKEN.GLOBAL);
  gg.set(PRESET_GLOBAL.STONE, stone);
  gg.set(PRESET_GLOBAL.FAST, stone.fast);

  stone.fast.logger.i('框架启动完成');
}
