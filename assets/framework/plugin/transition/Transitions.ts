import { tween, v3, view, Node, Vec3 } from 'cc';
import { PRESET_TRANSITIONS } from 'fast/config/Transition';
import { Noise } from 'fast/foundation/Noise';
import { dict, random } from 'fast/util';

import { ITransitionArgs, ITransitionEntry } from './ITransitionPlugin';

/** 模糊入场动画 */
export const BlurIn: ITransitionEntry = {
  lib: PRESET_TRANSITIONS.BLUR_IN,
  args: {
    duration: 0.2,
  },
  create(node: Node, args: ITransitionArgs) {
    const time = args.duration;
    node.opacity = 0;
    return tween(node).set({ opacity: 0 }).to(time, { opacity: 255 }, { easing: 'sineInOut' });
  },
};

/** 模糊出场动画 */
export const BlurOut: ITransitionEntry = {
  lib: PRESET_TRANSITIONS.BLUR_OUT,
  args: {
    duration: 0.2,
  },
  create(node: Node, args: ITransitionArgs) {
    const time = args.duration;
    node.opacity = 255;
    return tween(node).set({ opacity: 255 }).to(time, { opacity: 0 }, { easing: 'sineInOut' });
  },
};

/** 抽屉入场动画 */
export const DrawerIn: ITransitionEntry = {
  lib: PRESET_TRANSITIONS.DRAWER_IN,
  args: {
    duration: 0.2,
  },
  create(node: Node, args: ITransitionArgs) {
    const time = args.duration;
    const oy = view.getVisibleSize().height >> 1;
    const nh = node.h >> 1;
    const y1 = oy + nh + 10;
    const y2 = oy - nh - 10;
    node.y = y1;
    return tween(node).set({ y: y1 }).to(time, { y: y2 }, { easing: 'sineInOut' });
  },
};

/** 抽屉出场动画 */
export const DrawerOut: ITransitionEntry = {
  lib: PRESET_TRANSITIONS.DRAWER_OUT,
  args: {
    duration: 0.2,
  },
  create(node: Node, args: ITransitionArgs) {
    const time = args.duration;
    const oy = view.getVisibleSize().height >> 1;
    const nh = node.h >> 1;
    const y1 = oy + nh + 10;
    const y2 = oy - nh - 10;
    node.y = y2;
    return tween(node).set({ y: y2 }).to(time, { y: y1 }, { easing: 'sineInOut' });
  },
};

/**
 * 弹窗入场动画
 */
export const PopupIn: ITransitionEntry = {
  lib: PRESET_TRANSITIONS.POPUP_IN,
  args: {
    duration: 0.2,
  },
  create(node: Node, args: ITransitionArgs) {
    const s1 = new Vec3(0.1, 0.1, 1);
    const s2 = new Vec3(1.15, 1.15, 1);
    const time = args.duration;
    const t1 = time * 0.725;
    const t2 = time - t1;
    node.setScale(s1);
    return tween(node)
      .set({ opacity: 0, scale: s1 })
      .to(t1, { opacity: 255, scale: s2 }, { easing: 'sineIn' })
      .to(t2, { scale: Vec3.ONE }, { easing: 'sineIn' });
  },
};

/**
 * 弹窗出场动画
 */
export const PopupOut: ITransitionEntry = {
  lib: PRESET_TRANSITIONS.POPUP_OUT,
  args: {
    duration: 0.2,
  },
  create(node: Node, args: ITransitionArgs) {
    const s1 = new Vec3(1.15, 1.15, 1);
    const s2 = new Vec3(0.1, 0.1, 1);
    const time = args.duration;
    const t1 = time * 0.275;
    const t2 = time - t1;
    return tween(node)
      .set({ opacity: 255 })
      .to(t1, { scale: s1 }, { easing: 'sineOut' })
      .to(t2, { opacity: 0, scale: s2 }, { easing: 'sineOut' });
  },
};

/**
 * 数字滚动动画
 * @param target 目标节点
 * @param duration 滚动时间
 * @param start 开始数值
 * @param end 结束数值
 * @param prefix 前缀
 * @param suffix 后缀
 * @returns
 */
export const ScrollNumber: ITransitionEntry = {
  lib: PRESET_TRANSITIONS.SCROLL_NUMBER,
  args: {
    duration: 1,
    start: 0,
    end: 100,
    prefix: '',
    suffix: '',
  },
  create: (node: Node, args: ITransitionArgs) => {
    const { duration, start, end, prefix, suffix } = args;

    const uiLabel = node.uiLabel;
    if (!uiLabel || !uiLabel.isValid) {
      throw new Error('必须挂载 Label 组件！');
      return tween(node);
    }

    // 边界情况处理
    if (start === end || duration <= 0) {
      uiLabel.string = prefix + end.toString() + suffix;
      return tween(node);
    }

    const diff = end - start;
    let oldNum = start;

    // 创建控制对象用于tween
    const target = node! as Node & { progress: number };
    target.progress = 0;

    return tween(target)
      .to(
        duration,
        { progress: 1 },
        {
          // 使用线性插值确保时间精确
          easing: 'linear',
          onUpdate: (target) => {
            // 计算当前精确值
            const current = start + diff * target!.progress;
            // 四舍五入取整显示
            const displayNum = Math.round(current);
            // 仅当数值变化时更新显示
            if (displayNum !== oldNum) {
              uiLabel.string = prefix + displayNum.toString() + suffix;
              oldNum = displayNum;
            }
          },
        }
      )
      .call(() => {
        // 确保最终值准确
        uiLabel.string = prefix + end.toString() + suffix;
      });
  },
};

/**
 * 创建抖动缓动
 * @param node 目标节点
 * @param args 缓动参数
 * @returns 缓动
 */
function createShakeTransition(node: Node, args: ITransitionArgs) {
  const time = args.duration;
  const intensity = args.intensity;
  const frequency = args.frequency;
  const { x, y, z } = node.position;

  const target = node as Node & { progress: number };
  target.progress = 0;
  const noise = new Noise();
  noise.seed(random.random());

  return tween(target).to(
    time,
    { progress: 1 },
    {
      onUpdate: (_, ratio) => {
        const fadeout = 1 - ratio!;
        const time = ratio! * frequency;
        const noiseX = noise.perlin2(time, 0) * intensity * fadeout;
        const noiseY = noise.perlin2(time, 2000) * intensity * fadeout;
        node.setPosition(x + noiseX, y + noiseY, z);
      },
      onComplete: () => {
        node.setPosition(x, y, z);
        dict.unset(target, 'progress');
      },
    }
  );
}

/**
 * 节点抖动动画（使用噪声图使抖动更顺滑）
 * @description
 * ### 强度 (Intensity)
 *  - **1-3**: 轻微抖动，适合UI反馈
 *  - **4-8**: 中等抖动，适合一般游戏效果
 *  - **9-15**: 强烈抖动，适合爆炸、撞击
 *  - **16+**: 极强抖动，适合地震、大爆炸
 *
 *  ### 持续时间 (Duration)
 *  - **0.1-0.2s**: 快速反馈
 *  - **0.3-0.6s**: 常规效果
 *  - **0.7-1.5s**: 长时间效果
 *  - **1.5s+**: 持续性效果（如地震）
 *
 *  ### 频率 (Frequency)
 *  - **10-20**: 慢速抖动，适合重物撞击
 *  - **20-35**: 中速抖动，通用效果
 *  - **35-50**: 快速抖动，适合机械振动
 *  - **50+**: 极快抖动，适合电子干扰
 * @param target 目标节点
 * @param intensity 抖动强度
 * @param duration 抖动持续时间（秒）
 * @param frequency 抖动频率
 */
export const Shake: ITransitionEntry = {
  lib: PRESET_TRANSITIONS.SHAKE,
  args: {
    duration: 0.2,
    intensity: 1,
    frequency: 10,
  },
  create: createShakeTransition,
};

/**
 * 轻微震动 - 适用于UI点击反馈
 */
export const Wave: ITransitionEntry = {
  lib: PRESET_TRANSITIONS.WAVE,
  args: {
    duration: 0.2,
    intensity: 3,
    frequency: 40,
  },
  create: createShakeTransition,
};

/**
 * 快速震动 - 适用于机械故障效果
 * @param target 目标节点
 * @returns
 */
export const Vibration: ITransitionEntry = {
  lib: PRESET_TRANSITIONS.VIBRATION,
  args: {
    duration: 0.4,
    intensity: 6,
    frequency: 45,
  },
  create: createShakeTransition,
};

/**
 * 中等震动 - 适用于普通爆炸效果
 * @param target 目标节点
 * @returns
 */
export const Explosion: ITransitionEntry = {
  lib: PRESET_TRANSITIONS.EXPLOSION,
  args: {
    duration: 0.6,
    intensity: 10,
    frequency: 25,
  },
  create: createShakeTransition,
};

/**
 * 强烈震动 - 适用于大型爆炸或地震效果
 * @param target 目标节点
 * @returns
 */
export const Earthquake: ITransitionEntry = {
  lib: PRESET_TRANSITIONS.EARTH_QUAKE,
  args: {
    duration: 1.5,
    intensity: 12,
    frequency: 15,
  },
  create: createShakeTransition,
};

/**
 * 果冻效果动画
 * @param target 目标节点
 * @param duration 动画时长
 * @param strength 强度 0-1
 */
export const Jelly: ITransitionEntry = {
  lib: PRESET_TRANSITIONS.JELLY,
  args: {
    duration: 0.6,
    strength: 0.16,
  },
  create: (target: Node, args: ITransitionArgs) => {
    // 保存原始状态
    const originalScale = new Vec3(target.scale.x, target.scale.y, 1);
    const originalPos = target.position.clone();
    const { duration, strength } = args;

    // 第一阶段：快速收缩 + 左偏移
    // 第二阶段：弹性扩张 + 右偏移
    // 第三阶段：恢复状态 + 微抖动
    return tween(target)
      .to(
        duration * 0.2,
        {
          scale: v3(originalScale.x - strength, originalScale.y + strength, 1),
          position: v3(originalPos.x - strength * 10, originalPos.y),
        },
        { easing: 'sineOut' }
      )
      .to(
        duration * 0.3,
        {
          scale: v3(originalScale.x + strength * 0.8, originalScale.y - strength * 0.8, 1),
          position: v3(originalPos.x + strength * 15, originalPos.y),
        },
        { easing: 'quadInOut' }
      )
      .to(
        duration * 0.5,
        {
          scale: originalScale,
          position: originalPos,
        },
        {
          easing: 'elasticOut',
          onUpdate: (target, ratio) => {
            // 添加恢复阶段的微抖动
            target!.x = originalPos.x + Math.sin(ratio! * Math.PI * 8) * strength * 3;
          },
        }
      );
  },
};
