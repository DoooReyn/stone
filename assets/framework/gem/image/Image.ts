import { _decorator, Size, Sprite } from 'cc';
import { PRESET_TOKEN } from 'fast/config/Token';
import { fast } from 'fast/Fast';
import { FastError } from 'fast/foundation/Error';
import { IResCachePlugin } from 'fast/plugin/res/IResCachePlugin';
import { IResLoaderPlugin } from 'fast/plugin/res/IResLoaderPlugin';
import { CCImageFitMode, ImageFitMode, IImageAttr, LoadState } from 'fast/Types';
import { be } from 'fast/util';

import { Gem } from '../Gem';

const { ccclass, menu, property, requireComponent } = _decorator;

/**
 * 图像组件
 * @notes 封装 cc.Sprite
 */
@ccclass('Gem/ImageView')
@menu('Gem/ImageView')
@requireComponent(Sprite)
export class ImageView extends Gem {
  // ------------------------------- 静态成员区 -------------------------------

  /**
   * 获取图像属性
   * @param image 图像
   * @param key 属性名称
   * @returns
   */
  public static GetImageAttr<S extends keyof IImageAttr>(image: Sprite, key: S) {
    let attr = undefined;
    switch (key) {
      case 'viewMode':
        attr = image.type;
        break;
      case 'sizeMode':
        attr = image.sizeMode;
        break;
      case 'fillMode':
        attr = image.fillType;
        break;
      case 'fillStart':
        attr = image.fillStart;
        break;
      case 'fillCenter':
        attr = image.fillCenter;
        break;
      case 'fillRange':
        attr = image.fillRange;
        break;
      case 'gray':
        attr = image.grayscale;
        break;
    }
    return attr as IImageAttr[S];
  }

  /**
   * 设置图像属性
   * @param view 图像
   * @param attrs 图像属性
   */
  public static SetImageAttr(view: Sprite, attrs: Partial<IImageAttr>) {
    if (be.notUndefined(attrs.viewMode)) {
      view.type = attrs.viewMode;
    }
    if (be.notUndefined(attrs.sizeMode)) {
      view.sizeMode = attrs.sizeMode;
    }
    if (be.notUndefined(attrs.fillMode)) {
      view.fillType = attrs.fillMode;
    }
    if (be.notUndefined(attrs.fillStart)) {
      view.fillStart = attrs.fillStart;
    }
    if (be.notUndefined(attrs.fillCenter)) {
      view.fillCenter.set(attrs.fillCenter);
    }
    if (be.notUndefined(attrs.fillRange)) {
      view.fillRange = attrs.fillRange;
    }
    if (be.notUndefined(attrs.gray)) {
      view.grayscale = attrs.gray;
    }
    view.markForUpdateRenderData(true);
  }

  // ------------------------------- 属性声明区 -------------------------------

  /** 适配模式 */
  @property({ type: CCImageFitMode, displayName: '适配模式' })
  protected $fitMode = ImageFitMode.None;

  /** 资源地址 */
  @property({ displayName: '资源地址', tooltip: '支持本地和远程' })
  protected $url: string = '';

  /** 内容 */
  protected $image: Sprite;

  /** 显示区域 */
  protected $viewArea: Size = new Size();

  /** 加载状态 */
  private _loadState: LoadState = LoadState.Init;

  /** 加载中的资源地址 */
  private _loadingUrl: string = '';

  /** 临时的资源地址，用于回退 */
  private _tempUrl: string = '';

  // ------------------------------- 公开访问区 -------------------------------

  /** 适配模式 */
  get fitMode() {
    return this.$fitMode;
  }
  set fitMode(mode: ImageFitMode) {
    if (this.$fitMode != mode && mode >= ImageFitMode.None && mode <= ImageFitMode.Height) {
      this.$fitMode = mode;
      this.updateView();
    }
  }

  /** 当前资源地址 */
  get url() {
    return this.$url;
  }
  set url(url: string) {
    if (url !== this.$url) {
      this._tempUrl = this.$url;
      this._loadState = LoadState.Init;
      this.$url = url;
      this.loadContent();
    }
  }

  /** 显示区域 */
  get viewArea() {
    return this.$viewArea;
  }
  set viewArea(area: Size) {
    if (!this.$viewArea.equals(area)) {
      this.$viewArea.set(area);
      this.updateView();
    }
  }

  /**
   * 将当前节点尺寸固化为显示区域
   */
  syncViewArea() {
    this.viewArea = this.node.size;
  }

  /**
   * 清空内容
   */
  clearContent() {
    if (this.$url) {
      const cache = fast.acquire<IResCachePlugin>(PRESET_TOKEN.RES_CACHE);
      cache.decRef(this.$url);
    }
    this.$url = '';
    this._loadingUrl = '';
    this._loadState = LoadState.Init;
    this.$image.spriteFrame = null;
  }

  /**
   * 获取图像属性
   * @param key 属性名称
   * @returns
   */
  get<S extends keyof IImageAttr>(key: S) {
    return ImageView.GetImageAttr(this.$image, key);
  }

  /**
   * 设置图像属性
   * @param attrs 图像属性
   */
  set(attrs: Partial<IImageAttr>) {
    ImageView.SetImageAttr(this.$image, attrs);
  }

  // ------------------------------- 受限访问区 -------------------------------

  /**
   * 加载内容
   */
  protected async loadContent() {
    if (this.$url && this._loadState !== LoadState.Loading) {
      this._loadState = LoadState.Loading;

      const curUrl = (this._loadingUrl = this.$url);
      const loader = fast.acquire<IResLoaderPlugin>(PRESET_TOKEN.RES_LOADER);
      const image = await loader.loadSpriteFrame(curUrl);
      const ok = !!image;

      if (ok) {
        if (curUrl === this._loadingUrl && this.isValid && this.$image && this.$image.isValid) {
          this.$image.spriteFrame = image;
          this.updateView();
          const cache = fast.acquire<IResCachePlugin>(PRESET_TOKEN.RES_CACHE);
          // 增持当前资源
          cache.addRef(curUrl);
          // 减持上份资源
          if (this._tempUrl) {
            cache.decRef(this._tempUrl);
          }
        }
      } else {
        if (this._tempUrl) {
          // 还原到上一次的资源地址
          this.$url = this._tempUrl;
        }
      }

      this._loadState = ok ? LoadState.Ok : LoadState.Bad;
      this._tempUrl = '';
      this._loadingUrl = '';
    }
  }

  protected didCreate(): void {
    this.$image = this.getComponent(Sprite)!;
    if (!this.$image) throw new FastError(PRESET_TOKEN.GUI, '内容未设置');

    // 初始显示区域即节点的尺寸
    this.$viewArea.set(this.node.size);
  }

  protected didLaunch(): void {
    this.loadContent();
  }

  /**
   * 更新视图
   */
  protected updateView() {
    const content = this.$image.spriteFrame;
    if (content) {
      const area = this.node;
      const { width: aw, height: ah } = this.$viewArea;
      const { width: cw, height: ch } = content.rect;
      switch (this.$fitMode) {
        case ImageFitMode.None:
          area.setSize(cw, ch);
          break;
        case ImageFitMode.Area:
          area.setSize(aw, ah);
          break;
        case ImageFitMode.Width:
          area.setSize(aw, (cw / aw) * ch);
          break;
        case ImageFitMode.Height:
          area.setSize((ch / ah) * cw, ah);
          break;
      }
    }
  }
}
