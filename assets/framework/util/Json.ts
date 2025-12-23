import { runSync } from './Might';

/**
 * 将对象编码为 JSON 字符串（紧凑格式，无缩进）
 * @param data 要编码的对象
 * @returns JSON 字符串
 */
function encode(data: Object) {
  return JSON.stringify(data, null, 0);
}

/**
 * 将 JSON 字符串解码为对象（带错误处理）
 * @template T 解码后的对象类型
 * @param data 要解码的 JSON 字符串
 * @returns 解码后的对象，如果解析失败则返回 undefined
 */
function decode<T extends Object>(data: string) {
  return runSync<T | undefined>(() => JSON.parse(data))[0];
}

export { encode, decode };
