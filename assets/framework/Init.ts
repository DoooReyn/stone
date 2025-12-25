import * as stone from './index';

export async function boot() {
  // 插件列表
  // - 按照依赖关系进行排序，无依赖的应该放在最前面
  // - 可以根据需要酌情删减
  const plugins = [
    stone.GlobalPlugin,
    stone.ObjectPoolPlugin,
    stone.NodePoolPlugin,
    stone.EventBusPlugin,
    stone.TimerPlugin,
    stone.SensitivePlugin,
    stone.TableQueryPlugin,
    stone.TransitionPlugin,

    stone.Catcher,
    stone.ArgParserPlugin,
    stone.StoragePlugin,
    stone.I18nPlugin,
    stone.RedPlugin,

    stone.ProfilerPlugin,
    stone.AppPlugin,
  ];

  // 注册插件
  for (const plugin of plugins) {
    stone.fast.register(plugin);
  }

  // 初始化插件（按顺序）
  for (const plugin of plugins) {
    stone.fast.logger.d(`插件 ⁅${plugin.Token}⁆ 准备中`);
    await stone.fast.acquire(plugin.Token).initialize();
    stone.fast.logger.d(`插件 ⁅${plugin.Token}⁆ 已就绪`);
  }

  // 在发布模式下统一提升日志等级
  if (stone.fast.acquire<stone.IArgParserPlugin>(stone.PRESET_TOKEN.ARG_PARSER).isProd) {
    stone.logcat.each((logger) => {
      if (logger.level <= stone.LogLevel.DEBUG) {
        logger.level = stone.LogLevel.WARN;
      }
    });
  }

  // 注册对象池
  const objectPool = stone.fast.acquire<stone.IObjectPoolPlugin>(stone.PRESET_TOKEN.OBJECT_POOL);
  objectPool.register(stone.Trigger, stone.PRESET_OBJECT_POOL.TRIGGER);
  objectPool.register(stone.Option, stone.PRESET_OBJECT_POOL.OPTION);
  objectPool.register(stone.Counter, stone.PRESET_OBJECT_POOL.COUNTER);
  objectPool.register(stone.Model, stone.PRESET_OBJECT_POOL.MODEL);

  // 将 Fast 框架实例注册到全局变量中
  const gg = stone.fast.acquire<stone.IGlobalPlugin>(stone.PRESET_TOKEN.GLOBAL);
  gg.set(stone.PRESET_GLOBAL.STONE, stone);
  gg.set(stone.PRESET_GLOBAL.FAST, stone.fast);

  stone.fast.logger.i('框架启动完成');
}
