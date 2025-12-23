/**
 * LZ-based compression algorithm, version 1.4.5
 * Optimized TypeScript version with error fixes
 */
interface LZStringInterface {
  compressToBase64(input: string | null): string;
  decompressFromBase64(input: string | null): string | null;
  compressToUTF16(input: string | null): string;
  decompressFromUTF16(compressed: string | null): string | null;
  compressToUint8Array(uncompressed: string): Uint8Array;
  decompressFromUint8Array(compressed: Uint8Array | null | undefined): string | null;
  compressToEncodedURIComponent(input: string | null): string;
  decompressFromEncodedURIComponent(input: string | null): string | null;
  compress(uncompressed: string | null): string;
  decompress(compressed: string | null): string | null;
  _compress(uncompressed: string | null, bitsPerChar: number, getCharFromInt: (a: number) => string): string;
  _decompress(length: number, resetValue: number, getNextValue: (index: number) => number): string | null;
}

// Constants
const f = String.fromCharCode;
const keyStrBase64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const keyStrUriSafe = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$';
const baseReverseDic: { [key: string]: { [key: string]: number } } = {};

function getBaseValue(alphabet: string, character: string): number {
  if (!baseReverseDic[alphabet]) {
    baseReverseDic[alphabet] = {};
    for (let i = 0; i < alphabet.length; i++) {
      baseReverseDic[alphabet][alphabet.charAt(i)] = i;
    }
  }
  return baseReverseDic[alphabet][character];
}

const LZString: LZStringInterface = {
  compressToBase64(input: string | null): string {
    if (input == null) return '';
    const res = LZString._compress(input, 6, (a: number) => keyStrBase64.charAt(a));
    switch (res.length % 4) {
      case 0:
        return res;
      case 1:
        return `${res}===`;
      case 2:
        return `${res}==`;
      case 3:
        return `${res}=`;
      default:
        return res;
    }
  },

  decompressFromBase64(input: string | null): string | null {
    if (input == null) return '';
    if (input === '') return null;
    return LZString._decompress(input.length, 32, (index: number) => getBaseValue(keyStrBase64, input.charAt(index)));
  },

  compressToUTF16(input: string | null): string {
    if (input == null) return '';
    return `${LZString._compress(input, 15, (a: number) => f(a + 32))} `;
  },

  decompressFromUTF16(compressed: string | null): string | null {
    if (compressed == null) return '';
    if (compressed === '') return null;
    return LZString._decompress(compressed.length, 16384, (index: number) => compressed.charCodeAt(index) - 32);
  },

  compressToUint8Array(uncompressed: string): Uint8Array {
    const compressed = LZString.compress(uncompressed);
    const buf = new Uint8Array(compressed.length * 2); // 2 bytes per character

    for (let i = 0; i < compressed.length; i++) {
      const currentValue = compressed.charCodeAt(i);
      buf[i * 2] = currentValue >>> 8;
      buf[i * 2 + 1] = currentValue % 256;
    }
    return buf;
  },

  decompressFromUint8Array(compressed: Uint8Array | null | undefined): string | null {
    if (compressed === null || compressed === undefined) {
      return null;
    }

    const buf: number[] = [];
    for (let i = 0; i < compressed.length / 2; i++) {
      buf[i] = compressed[i * 2] * 256 + compressed[i * 2 + 1];
    }

    const result: string[] = [];
    buf.forEach((c: number) => {
      result.push(f(c));
    });
    return LZString.decompress(result.join(''));
  },

  compressToEncodedURIComponent(input: string | null): string {
    if (input == null) return '';
    return LZString._compress(input, 6, (a: number) => keyStrUriSafe.charAt(a));
  },

  decompressFromEncodedURIComponent(input: string | null): string | null {
    if (input == null) return '';
    if (input === '') return null;
    input = input.replace(/ /g, '+');
    return LZString._decompress(input.length, 32, (index: number) => getBaseValue(keyStrUriSafe, input!.charAt(index)));
  },

  compress(uncompressed: string | null): string {
    return LZString._compress(uncompressed, 16, (a: number) => f(a));
  },

  /* eslint-disable camelcase */
  _compress(uncompressed: string | null, bitsPerChar: number, getCharFromInt: (a: number) => string): string {
    if (uncompressed == null) return '';
    let i: number;
    let value: number;
    const context_dictionary: { [key: string]: number } = {};
    const context_dictionaryToCreate: { [key: string]: boolean } = {};
    let context_c = '';
    let context_wc = '';
    let context_w = '';
    let context_enlargeIn = 2; // Compensate for the first entry which should not count
    let context_dictSize = 3;
    let context_numBits = 2;
    const context_data: string[] = [];
    let context_data_val = 0;
    let context_data_position = 0;
    let ii: number;

    for (ii = 0; ii < uncompressed.length; ii += 1) {
      context_c = uncompressed.charAt(ii);
      if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
        context_dictionary[context_c] = context_dictSize++;
        context_dictionaryToCreate[context_c] = true;
      }

      context_wc = context_w + context_c;
      if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
        context_w = context_wc;
      } else {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
          if (context_w.charCodeAt(0) < 256) {
            for (i = 0; i < context_numBits; i++) {
              context_data_val = context_data_val << 1;
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
            }
            value = context_w.charCodeAt(0);
            for (i = 0; i < 8; i++) {
              context_data_val = (context_data_val << 1) | (value & 1);
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          } else {
            value = 1;
            for (i = 0; i < context_numBits; i++) {
              context_data_val = (context_data_val << 1) | value;
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = 0;
            }
            value = context_w.charCodeAt(0);
            for (i = 0; i < 16; i++) {
              context_data_val = (context_data_val << 1) | (value & 1);
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          delete context_dictionaryToCreate[context_w];
        } else {
          value = context_dictionary[context_w];
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1) | (value & 1);
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        // Add wc to the dictionary.
        context_dictionary[context_wc] = context_dictSize++;
        context_w = String(context_c);
      }
    }

    // Output the code for w.
    if (context_w !== '') {
      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
        if (context_w.charCodeAt(0) < 256) {
          for (i = 0; i < context_numBits; i++) {
            context_data_val = context_data_val << 1;
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
          }
          value = context_w.charCodeAt(0);
          for (i = 0; i < 8; i++) {
            context_data_val = (context_data_val << 1) | (value & 1);
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        } else {
          value = 1;
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1) | value;
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = 0;
          }
          value = context_w.charCodeAt(0);
          for (i = 0; i < 16; i++) {
            context_data_val = (context_data_val << 1) | (value & 1);
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        delete context_dictionaryToCreate[context_w];
      } else {
        value = context_dictionary[context_w];
        for (i = 0; i < context_numBits; i++) {
          context_data_val = (context_data_val << 1) | (value & 1);
          if (context_data_position == bitsPerChar - 1) {
            context_data_position = 0;
            context_data.push(getCharFromInt(context_data_val));
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }
      }
      context_enlargeIn--;
      if (context_enlargeIn == 0) {
        context_enlargeIn = Math.pow(2, context_numBits);
        context_numBits++;
      }
    }

    // Mark the end of the stream
    value = 2;
    for (i = 0; i < context_numBits; i++) {
      context_data_val = (context_data_val << 1) | (value & 1);
      if (context_data_position == bitsPerChar - 1) {
        context_data_position = 0;
        context_data.push(getCharFromInt(context_data_val));
        context_data_val = 0;
      } else {
        context_data_position++;
      }
      value = value >> 1;
    }

    // Flush the last char
    while (true) {
      context_data_val = context_data_val << 1;
      if (context_data_position == bitsPerChar - 1) {
        context_data.push(getCharFromInt(context_data_val));
        break;
      } else context_data_position++;
    }
    return context_data.join('');
  },
  /* eslint-enable camelcase */

  decompress(compressed: string | null): string | null {
    if (compressed == null) return '';
    if (compressed === '') return null;
    return LZString._decompress(compressed.length, 32768, (index: number) => compressed.charCodeAt(index));
  },

  _decompress(length: number, resetValue: number, getNextValue: (index: number) => number): string | null {
    const dictionary: (string | undefined)[] = [];
    let enlargeIn = 4;
    let dictSize = 4;
    let numBits = 3;
    let entry = '';
    const result: string[] = [];
    let i: number;
    let w: string;
    let bits: number;
    let resb: number;
    let maxpower: number;
    let power: number;
    let c: number;
    const data = { val: getNextValue(0), position: resetValue, index: 1 };

    for (i = 0; i < 3; i += 1) {
      dictionary[i] = i.toString();
    }

    bits = 0;
    maxpower = Math.pow(2, 2);
    power = 1;
    while (power != maxpower) {
      resb = data.val & data.position;
      data.position >>= 1;
      if (data.position == 0) {
        data.position = resetValue;
        data.val = getNextValue(data.index++);
      }
      bits |= (resb > 0 ? 1 : 0) * power;
      power <<= 1;
    }

    switch (bits) {
      case 0:
        bits = 0;
        maxpower = Math.pow(2, 8);
        power = 1;
        while (power != maxpower) {
          resb = data.val & data.position;
          data.position >>= 1;
          if (data.position == 0) {
            data.position = resetValue;
            data.val = getNextValue(data.index++);
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }
        c = bits;
        break;
      case 1:
        bits = 0;
        maxpower = Math.pow(2, 16);
        power = 1;
        while (power != maxpower) {
          resb = data.val & data.position;
          data.position >>= 1;
          if (data.position == 0) {
            data.position = resetValue;
            data.val = getNextValue(data.index++);
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }
        c = bits;
        break;
      case 2:
        return '';
      default:
        return null;
    }
    dictionary[3] = f(c);
    w = f(c);
    result.push(f(c));
    while (true) {
      if (data.index > length) {
        return '';
      }

      bits = 0;
      maxpower = Math.pow(2, numBits);
      power = 1;
      while (power != maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position == 0) {
          data.position = resetValue;
          data.val = getNextValue(data.index++);
        }
        bits |= (resb > 0 ? 1 : 0) * power;
        power <<= 1;
      }

      switch (bits) {
        case 0:
          bits = 0;
          maxpower = Math.pow(2, 8);
          power = 1;
          while (power != maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }

          dictionary[dictSize++] = f(bits);
          c = dictSize - 1;
          enlargeIn--;
          break;
        case 1:
          bits = 0;
          maxpower = Math.pow(2, 16);
          power = 1;
          while (power != maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }
          dictionary[dictSize++] = f(bits);
          c = dictSize - 1;
          enlargeIn--;
          break;
        case 2:
          return result.join('');
        default:
          break;
      }

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }

      if (dictionary[c]) {
        entry = dictionary[c]!;
      } else {
        if (c === dictSize) {
          entry = w + w.charAt(0);
        } else {
          return null;
        }
      }
      result.push(entry);

      // Add w+entry[0] to the dictionary.
      dictionary[dictSize++] = w + entry.charAt(0);
      enlargeIn--;

      w = entry;

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }
    }
  },
};

// Export the main functions
export const encode = LZString.compress;
export const decode = LZString.decompress;
export const encodeToBase64 = LZString.compressToBase64;
export const decodeFromBase64 = LZString.decompressFromBase64;
export const encodeToUint8Array = LZString.compressToUint8Array;
export const decodeFromUint8Array = LZString.decompressFromUint8Array;
