import { _decorator, Component } from 'cc';

import { boot } from '../../framework/Init';

const { ccclass, property } = _decorator;

@ccclass('Boot')
export class Boot extends Component {
  async start() {
    await boot();
  }
}
