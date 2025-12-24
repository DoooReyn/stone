import { _decorator, Component } from 'cc';
import { boot, misc } from 'fast/index';

const { ccclass, property } = _decorator;

@ccclass('Boot')
export class Boot extends Component {
  async start() {
    const stop = misc.addTimeStop('框架启动');
    await boot();
    stop();
  }
}
