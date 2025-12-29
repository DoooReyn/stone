import { misc, sys, v2, Label, Texture2D } from 'cc';
import { PRESET_EVENT_NAME } from 'fast/config/Event';
import { PRESET_TOKEN } from 'fast/config/Token';
import { fast } from 'fast/Fast';
import { IResLoaderPlugin } from 'fast/plugin/res/IResLoaderPlugin';
import { AnyFn, Dict, ITextStyle } from 'fast/Types';

import { notUndefined } from './Be';
import { from } from './Color';
import { runAsync, runSync } from './Might';

/** 内置上下文 */
const CTX: object = {};

/** 纹理过滤模式 */
const { LINEAR, NEAREST } = Texture2D.Filter;

/**
 * 空转方法
 */
function idle(...args: any[]) {}

/**
 * 防抖
 * - 当事件被触发后，要等待一段时间后才执行函数
 * - 如果在等待时间内再次触发事件，将重新计时
 * - 应用场景：
 *      - 实时监听输入事件
 *      - 防止用户多次点击按钮
 * @param handle 执行函数
 * @param context 执行上下文
 * @param delay 延迟时间
 */
function debounce(handle: Function, context: object = CTX, delay: number = 300) {
  let timer: number | null = null;
  return function (...args: any[]) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      handle.apply(context, args);
      timer = null;
    }, delay);
  };
}

/**
 * 节流
 * - 当事件被触发后，等待一段时间后才执行函数
 * - 如果在等待时间内再次触发事件，将忽略本次触发
 * - 应用场景：
 *      - 监听鼠标移动事件
 *      - 监听滚动事件
 * @param handle 执行函数
 * @param context 执行上下文
 * @param delay 延迟时间
 */
function throttle(handle: Function, context: object = CTX, delay: number = 300) {
  let valid: boolean = true;
  let timer: number = 0;
  return function (...args: any[]) {
    if (!valid) return;
    if (timer) clearTimeout(timer);
    valid = false;
    timer = setTimeout(function () {
      handle.apply(context, args);
      timer = 0;
      valid = true;
    }, delay);
  };
}

/**
 * 禁止调试
 */
function ban() {
  if (sys.isBrowser) {
    document.oncontextmenu = function () {
      return false;
    };
    document.onkeydown = document.onkeyup = function (e) {
      return !!(e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I'));
    };
    (() => {
      const a = ['c', 'o', 'n', 's', 't', 'r', 'u', 'c', 't', 'o', 'r'].join('');
      const b = ['d', 'e', 'b', 'b', 'u', 'g', 'g', 'e', 'r'].join('');
      const c = ['c', 'a', 'l', 'l'].join('');
      const exec = () => setInterval(() => (<any>exec)[a](b)[c](), 50);
      exec();
    })();
  }
}

/**
 * 下一帧运行方法
 * @param exec 方法
 */
function nextTick(exec: () => void) {
  misc.callInNextTick(function () {
    runSync(exec);
  });
}

/**
 * 对贴图开启/关闭抗锯齿
 * @param tex 贴图
 * @param enabled 是否启用抗锯齿
 */
function setAntiAliasing(tex: Texture2D, enabled: boolean): void {
  let filter = enabled ? LINEAR : NEAREST;
  tex && tex.setFilters(filter, filter);
}

/**
 * 添加计时点
 * @param flag 计时标识
 * @returns
 */
function addTimeStop(flag: string) {
  const start = Date.now();
  return function stop() {
    fast.logger.d(`${flag}耗时 ${Date.now() - start} ms`);
  };
}

/**
 * 同步计时
 * @param flag 计时标识
 * @param operation 耗时操作
 */
function timeSync(flag: string, operation: AnyFn) {
  const stop = addTimeStop(flag);
  runSync(operation);
  stop();
}

/**
 * 异步计时
 * @param flag 计时标识
 * @param operation 耗时操作
 */
async function timeAsync(flag: string, operation: Promise<any>) {
  const stop = addTimeStop(flag);
  await runAsync(operation);
  stop();
}

/**
 * 模拟耗时操作
 * @param delay 操作时间
 */
function simulateLongTask(delay: number) {
  const start = performance.now();
  while (performance.now() - start < delay) {}
}

/**
 * 模拟耗时操作成功率
 * @param probability 成功率
 * @param delay 操作时间
 * @returns
 */
function simulateProbability(probability: number, delay = 1000) {
  return new Promise<boolean>((resolve) => {
    setTimeout(function () {
      resolve(Math.random() < probability);
    }, delay);
  });
}

/**
 * 获取文本样式
 * @param text 标签组件
 * @param style 样式
 * @returns
 */
function getTextStyle<S extends keyof ITextStyle>(text: Label, style: S): ITextStyle[S] {
  let attr = undefined;
  switch (style) {
    case 'text':
      attr = text.string;
      break;
    case 'family':
      attr = text.useSystemFont ? text.fontFamily : text.font?.name || '';
      break;
    case 'color':
      attr = text.color.toHEX();
      break;
    case 'size':
      attr = text.fontSize;
      break;
    case 'multiline':
      attr = text.enableWrapText;
      break;
    case 'bold':
      attr = text.isBold;
      break;
    case 'italic':
      attr = text.isItalic;
      break;
    case 'underline':
      attr = text.isUnderline;
      break;
    case 'outline':
      if (!text.enableOutline) {
        attr = { color: '', width: 0 };
      } else {
        attr = { color: text.outlineColor.toHEX(), width: text.outlineWidth };
      }
      break;
    case 'shadow':
      if (!text.enableShadow) {
        attr = { color: '', x: 0, y: 0, blur: 0 };
      } else {
        attr = {
          color: text.shadowColor.toHEX(),
          x: text.shadowOffset.x,
          y: text.shadowOffset.y,
          blur: text.shadowBlur,
        };
      }
      break;
    case 'alignHor':
      attr = text.horizontalAlign;
      break;
    case 'alignVer':
      attr = text.verticalAlign;
      break;
    case 'overflow':
      attr = text.overflow;
      break;
    case 'cacheMode':
      attr = text.cacheMode;
      break;
  }

  return attr as ITextStyle[S];
}

/**
 * 批量获取文本样式
 * @param styles 样式
 * @returns
 */
function getTextStyleBatch<S extends keyof ITextStyle>(text: Label, ...styles: S[]) {
  const attrs: Dict = {};
  const set = new Set(...styles);
  set.forEach((k: string) => {
    attrs[k] = getTextStyle(text, k as S);
  });
  return attrs;
}

/**
 * 设置文本样式
 * @param text 标签组件
 * @param style 文本样式
 */
function setTextStyle(text: Label, style: Partial<ITextStyle>) {
  if (notUndefined(style.family)) {
    // 应用字体，支持系统字体和资源加载字体
    const family = style.family!;
    if (family.startsWith('l:')) {
      const loader = fast.acquire<IResLoaderPlugin>(PRESET_TOKEN.RES_LOADER);
      loader.loadFont(family).then((font) => {
        if (font) {
          text.useSystemFont = false;
          text.font = font;
          text.node.emit(PRESET_EVENT_NAME.FONT_CHANGED, family);
        } else {
          text.useSystemFont = true;
          text.node.emit(PRESET_EVENT_NAME.FONT_CHANGED, text.fontFamily);
        }
      });
    } else {
      text.useSystemFont = true;
      text.fontFamily = family;
      text.node.emit(PRESET_EVENT_NAME.FONT_CHANGED, text.fontFamily);
    }
  }

  if (notUndefined(style.size)) {
    text.fontSize = style.size!;
    text.lineHeight = text.fontSize * 1.5;
  }

  if (notUndefined(style.multiline)) {
    // 自动行高
    text.enableWrapText = true;
    text.lineHeight = text.fontSize * 1.5;
  }

  if (notUndefined(style.color)) {
    text.color = from(style.color!);
  }

  if (notUndefined(style.bold)) {
    text.isBold = style.bold!;
  }

  if (notUndefined(style.italic)) {
    text.isItalic = style.italic!;
  }

  if (notUndefined(style.underline)) {
    text.isUnderline = style.underline!;
  }

  if (notUndefined(style.outline)) {
    text.enableOutline = true;
    text.outlineWidth = style.outline!.width;
    text.outlineColor = from(style.outline!.color);
  }

  if (notUndefined(style.shadow)) {
    text.enableShadow = true;
    text.shadowBlur = style.shadow!.blur;
    text.shadowColor = from(style.shadow!.color);
    text.shadowOffset = v2(style.shadow!.x, style.shadow!.y);
  }

  if (notUndefined(style.alignHor)) {
    text.horizontalAlign = style.alignHor!;
  }

  if (notUndefined(style.alignVer)) {
    text.verticalAlign = style.alignVer!;
  }

  if (notUndefined(style.overflow)) {
    text.overflow = style.overflow!;
  }

  if (notUndefined(style.cacheMode)) {
    text.cacheMode = style.cacheMode!;
  }
}

export {
  CTX,
  idle,
  debounce,
  throttle,
  ban,
  nextTick,
  setAntiAliasing,
  addTimeStop,
  timeAsync,
  timeSync,
  simulateLongTask,
  getTextStyle,
  getTextStyleBatch,
  setTextStyle,
};
