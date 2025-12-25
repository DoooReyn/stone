/** 框架内置资源相关配置 */
export const PRESET_RES = {
  /** 资源默认过期时间（毫秒） */
  ASSET_EXPIRES_MS: 120_000,
  /**
   * 音乐资源池条目参数
   * @note 音乐一般同时只能存在一个实例，因此 expands 和 capacity 保持短小精悍，可用即可
   * @note 音乐一般不会经常切换，因此过期时间可以设短一些，这样资源可以尽快释放
   */
  MUSIC_ENTRY_OPTIONS: {
    token: 'music-entry',
    expands: 1,
    capacity: 2,
    expires: 10_000,
  },
  /**
   * 音效资源池条目参数
   * @note 音效同时可以存在多个实例，因此 expands 和 capacity 可以适当加大一点
   * @note 音效一般会频繁播放，因此过期时间较音乐可以适当延长一些
   */
  SOUND_ENTRY_OPTIONS: {
    token: 'sound-entry',
    expands: 4,
    capacity: 16,
    expires: 30_000,
  },
  /** 默认富文本图集名称 */
  RICH_TEXT_ATLAS: 'richtext-default',
};
