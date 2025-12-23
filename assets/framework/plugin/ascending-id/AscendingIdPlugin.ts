import { PRESET_TOKEN } from 'fast/config/Token';
import { Plugin } from 'fast/foundation/Plugin';

/**
 * 递增ID生成器
 */
export class AscendingId extends Plugin {
  public static readonly Token: string = PRESET_TOKEN.ASCENDING_ID;

  /** 递增ID容器 */
  private _container: Map<string, [current: number, initial: number, maximum: number]> = new Map();

  create(token: string, initial: number = 0, maximum = 0) {
    if (!this.has(token)) {
      initial = Math.max(Math.floor(initial), 0);
      maximum = Math.max(Math.floor(maximum), 0);
      this._container.set(token, [initial, initial, maximum]);
      this.logger.df('首次创建 {0} -> {1} ⋘ {2}', token, initial, maximum);
    }
    return this._container.get(token)!;
  }

  has(token: string) {
    return this._container.has(token);
  }

  get(token: string) {
    return this._current(token)![0];
  }

  next(token: string) {
    const item = this._current(token);
    const [curr, initial, maximum] = item;
    if (maximum > 0 && curr == maximum) {
      return (item[0] = initial);
    } else {
      return (item[0] += 1);
    }
  }

  reset(token: string, initial?: number, maximum?: number) {
    if (this.has(token)) {
      const curr = this._current(token);
      if (initial != undefined) {
        curr[1] = initial;
      }
      if (maximum != undefined) {
        curr[2] = maximum;
      }
      curr[0] = curr[1];
    }
  }

  /**
   *
   * @param token 生成器标签
   * @returns
   */
  private _current(token: string) {
    return this.create(token);
  }
}
