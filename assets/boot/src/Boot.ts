import { _decorator, Component } from 'cc';

import { Fast } from '../../framework/Fast';
import { Global } from '../../framework/plugin/global/Global';

import type { IGlobal } from '../../framework/plugin/global/IGlobal';

const { ccclass, property } = _decorator;

@ccclass('Boot')
export class Boot extends Component {
  start() {
    Fast.Register(Global);
    Fast.Acquire<IGlobal>(Global.Token).set('fast', Fast);
  }

  update(deltaTime: number) {}
}
