import { _decorator, Component } from 'cc';

import { Fast } from '../../framework/Fast';
import { Global } from '../../framework/plugin/global/Global';

import type { IGlobal } from '../../framework/plugin/global/IGlobal';

const { ccclass, property } = _decorator;

@ccclass('Boot')
export class Boot extends Component {
  async start() {
    // 插件列表（按照依赖关系进行排序，无依赖的应该放在最前面）
    const plugins = [Global];

    // 注册插件
    for (const plugin of plugins) {
      Fast.Register(plugin);
    }

    // 初始化插件（按顺序）
    for (const plugin of plugins) {
      await Fast.Acquire(plugin.Token).initialize();
    }

    // 将 Fast 框架实例注册到全局变量中
    Fast.Acquire<IGlobal>(Global.Token).set('fast', Fast);
  }

  update(deltaTime: number) {}
}
