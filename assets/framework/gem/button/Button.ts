import { _decorator } from 'cc';

import { Gem } from '../Gem';

const { ccclass, menu } = _decorator;

@ccclass('Gem/Button')
@menu('Gem/Button')
export class Button extends Gem {
  protected $clickEnabled: boolean;
  protected $holdEnabled: boolean;
  protected $hoverEnabled: boolean;
}
