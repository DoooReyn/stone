import { _decorator, Component } from 'cc';

import * as stone from '../../framework';

const { ccclass, property } = _decorator;

@ccclass('Boot')
export class Boot extends Component {
  async start() {
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

    // 将 Fast 框架实例注册到全局变量中
    stone.fast.acquire<stone.IGlobal>(stone.GlobalPlugin.Token).set('stone', stone);
    stone.fast.acquire<stone.IGlobal>(stone.GlobalPlugin.Token).set('fast', stone.fast);

    stone.fast.logger.i('框架启动完成');
  }

  update(deltaTime: number) {}
}
