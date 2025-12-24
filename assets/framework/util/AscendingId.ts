import { fast } from 'fast/Fast';

/** 递增ID容器 */
const container: Map<string, [current: number, initial: number, maximum: number]> = new Map();

/**
 * 创建一个新的递增ID生成器
 * @param token 生成器标签
 * @param initial 初始值（默认 0）
 * @param maximum 最大值（≤0 不限制）
 * @returns 递增ID
 */
function create(token: string, initial: number = 0, maximum = 0) {
  if (!has(token)) {
    initial = Math.max(Math.floor(initial), 0);
    maximum = Math.max(Math.floor(maximum), 0);
    container.set(token, [initial, initial, maximum]);
    fast.logger.df('首次创建 {0} -> {1} ⋘ {2}', token, initial, maximum);
  }
  return container.get(token)!;
}

/**
 * 检查是否存在指定标签的递增ID生成器
 * @param token 生成器标签
 * @returns 是否存在
 */
function has(token: string) {
  return container.has(token);
}

/**
 * 获取指定标签的当前递增ID
 * @param token 生成器标签
 * @returns 当前递增ID
 */
function get(token: string) {
  return current(token)![0];
}

/**
 * 获取指定标签的下一个递增ID
 * @param token 生成器标签
 * @returns 下一个递增ID
 */
function next(token: string) {
  const item = current(token);
  const [curr, initial, maximum] = item;
  if (maximum > 0 && curr == maximum) {
    return (item[0] = initial);
  } else {
    return (item[0] += 1);
  }
}

/**
 * 重置指定标签的递增ID生成器
 * @param token 生成器标签
 * @param initial 初始值（默认 0）
 * @param maximum 最大值（≤0 不限制）
 */
function reset(token: string, initial?: number, maximum?: number) {
  if (has(token)) {
    const curr = current(token);
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
 * 当前编号
 * @param token 生成器标签
 * @returns
 */
function current(token: string) {
  return create(token);
}

export { has, create, get, next, current, reset };
