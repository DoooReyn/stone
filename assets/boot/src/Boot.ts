import { _decorator } from 'cc';
import { Gem } from 'fast/gem/Gem';
import { boot, misc } from 'fast/index';

const { ccclass, property } = _decorator;

@ccclass('Boot')
export class Boot extends Gem {
  protected async didCreate() {
    const stop = misc.addTimeStop('框架启动');
    await boot();
    stop();
  }
}
