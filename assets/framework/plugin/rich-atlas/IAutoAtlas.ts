import { ImageAsset, SpriteFrame } from 'cc';

/**
 * 自动图集接口
 */
export interface IAutoAtlas {
  /** 图集标识 */
  readonly token: string;
  /**
   * 查询图像
   * @param uuid 标识
   * @returns 是否存在图像
   */
  has(uuid: string): boolean;
  /**
   * 获取可用图像
   * @param uuid 标识
   * @returns 图像实例
   */
  acquire(uuid: string): SpriteFrame | null;
  /**
   * 添加图像
   * @param uuid 标识
   * @param image 图像
   */
  add(uuid: string, image: ImageAsset): void;
  /**
   * 删除所有纹理
   * @warn 你必须很清楚自己在做什么
   */
  destroy(): void;
}

/**
 * 自动图集配置
 */
export interface IAutoAtlasOptions {
  width: number;
  height: number;
  smart: boolean;
  border: number;
  padding: number;
}

/**
 * 自动图集等级
 * @description 控制 AutoAtlas 的纹理尺寸
 */
export enum AutoAtlasLevel {
  /** 微型：128x128 */
  Micro = 128,
  /** 小型：256x256 */
  Small = 256,
  /** 中型：512x512（默认） */
  Medium = 512,
  /** 大型：1024x1024 */
  Large = 1024,
  /** 超大型：2048x2048 */
  XLarge = 2048,
}

/**
 * 单个自动图集的占用信息
 */
export interface IAutoAtlasUsageEntry {
  /** 图集标识 */
  atlasKey: string;
  /** 图集纹理宽度（像素） */
  width: number;
  /** 图集纹理高度（像素） */
  height: number;
  /** 估算内存占用（字节，按 RGBA8888 4 字节/像素计算） */
  memoryBytes: number;
  /** 当前缓存的 glyph 数量 */
  glyphCount: number;
  /** 引用计数 */
  refCount: number;
}

/**
 * 自动图集整体占用信息
 */
export interface IAutoAtlasUsageSummary {
  /** 当前有效图集数量 */
  atlasCount: number;
  /** 所有图集估算内存占用总和（字节） */
  totalMemoryBytes: number;
  /** 各图集的详细占用信息 */
  atlases: IAutoAtlasUsageEntry[];
}
