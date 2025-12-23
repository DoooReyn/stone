import { _decorator, Component } from 'cc';
import { boot } from 'fast/index';

const { ccclass, property } = _decorator;

@ccclass('Boot')
export class Boot extends Component {
  async start() {
    await boot();
  }
}
