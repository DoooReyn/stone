import { deflate, inflate, Data } from 'pako';

/**
 * 使用 Zlib 算法压缩字符串数据
 * @param data 要压缩的字符串
 * @returns 压缩后的 Uint8Array 数据
 */
function encode(data: string) {
  return deflate(data);
}

/**
 * 使用 Zlib 算法解压缩数据为字符串
 * @param data 要解压缩的 Uint8Array 数据
 * @returns 解压缩后的字符串
 */
function decode(data: Data) {
  return inflate(data, { to: 'string' });
}

export { encode, decode };
