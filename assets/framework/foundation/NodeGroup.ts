import { isValid, Node } from 'cc';

import { Group } from './Group';

/**
 * 节点分组辅助工具
 */
export class NodeGroup extends Group<Node> {
  public constructor() {
    super();
    this.filter = isValid;
  }
}
