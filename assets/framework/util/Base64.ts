import { isValid, Base64 } from 'js-base64';

/**
 * 将字符串编码为标准的 Base64 格式
 * @param str 要编码的字符串
 * @returns Base64 编码后的字符串
 */
function encode(str: string) {
  return Base64.encode(str, false);
}

/**
 * 将字符串编码为 URL 安全的 Base64 格式（使用 - 和 _ 替换 + 和 /）
 * @param str 要编码的字符串
 * @returns URL 安全的 Base64 编码字符串
 */
function encodeURI(str: string) {
  return Base64.encode(str, true);
}

/**
 * 将 Base64 字符串解码为原始字符串
 * @param str Base64 编码的字符串
 * @returns 解码后的原始字符串
 */
function decode(str: string) {
  return Base64.decode(str);
}

/**
 * 将 URL 安全的 Base64 字符串解码为原始字符串
 * @param str URL 安全的 Base64 编码字符串
 * @returns 解码后的原始字符串
 */
const decodeURI = decode;

export { encode, encodeURI, decode, decodeURI, isValid };
