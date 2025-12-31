import {
  assetManager,
  js,
  path,
  sp,
  sys,
  __private,
  AnimationClip,
  Asset,
  AssetManager,
  AudioClip,
  BitmapFont,
  BufferAsset,
  Constructor,
  ImageAsset,
  JsonAsset,
  ParticleAsset,
  Prefab,
  Rect,
  SpriteAtlas,
  SpriteFrame,
  Texture2D,
  TextAsset,
  TiledMapAsset,
  TTFFont,
  VideoClip,
} from 'cc';
import { PRESET_RES } from 'fast/config/Res';
import { PRESET_TOKEN } from 'fast/config/Token';
import { Plugin } from 'fast/foundation/Plugin';
import { list } from 'fast/util';

import { IResAstcPlugin } from './IResAstcPlugin';
import { IResCachePlugin, ResCacheSource } from './IResCachePlugin';
import {
  IResLoaderPlugin,
  IResLoadOptions,
  IResLoadTask,
  IResLocal,
  IResRemote,
  ResLoadItem,
  ResPreloadItem,
} from './IResLoaderPlugin';

/**
 * 加载任务
 * @description
 */
class ResLoadTask<T extends Asset> implements IResLoadTask<T> {
  /** 任务是否正在加载 */
  private _loading: boolean;
  /** 任务是否已取消 */
  private _aborted: boolean;

  constructor(
    public readonly loader: ResLoaderPlugin,
    public readonly type: Constructor<T>,
    public readonly options: IResLoadOptions,
    public readonly onComplete?: (asset: T | null) => void,
    public readonly onSuccess?: (asset: T) => void,
    public readonly onFail?: () => void
  ) {
    this._loading = false;
    this._aborted = false;
  }

  get aborted() {
    return this._aborted;
  }

  get loading() {
    return this._loading;
  }

  load() {
    if (!this._loading) {
      this._loading = true;

      this.loader.load(this.type, this.options).then((asset) => {
        this?.onComplete?.(asset);
        if (asset && this._aborted) {
          this?.onSuccess?.(asset);
        } else {
          this?.onFail?.();
        }
      });
    }
  }

  abort() {
    this._aborted = true;
    this._loading = false;
  }
}

/**
 * 本地资源容器
 */
class ResLocal implements IResLocal {
  constructor(public readonly loader: ResLoaderPlugin) {}

  private _parsed: Map<string, boolean> = new Map();

  parsePath(path: string): [string, string] {
    const arr = path.split('@');
    if (arr.length == 1) {
      return ['resources', arr[0]];
    } else {
      arr[0] ||= 'resources';
      return arr as [string, string];
    }
  }

  pathOf(uuid: string) {
    let path = '';
    assetManager.bundles.find((ab) => {
      // @ts-ignore
      return ab.config.assetInfos.find((cfg: any) => {
        if (cfg.uuid === uuid) {
          path = cfg.path;
          return true;
        }
        return false;
      });
    });
    return path;
  }

  uuidOf(path: string) {
    let uuid = '';
    assetManager.bundles.find((bun) => {
      // @ts-ignore
      return bun.config.assetInfos.find((cfg: any) => {
        if (cfg.path === path) {
          uuid = cfg.uuid;
          return true;
        }
        return false;
      });
    });
    return uuid;
  }

  hasAB(ab: string): boolean {
    return assetManager.bundles.has(ab) || (<any>assetManager)._projectBundles.includes(ab);
  }

  loadAB(ab: string) {
    return new Promise<AssetManager.Bundle | null>((resolve) => {
      if (!this.hasAB(ab)) {
        this.loader.logger.e(`资源包 ⁅${ab}⁆ 加载失败，目标不存在`);
        resolve(null);
      } else {
        const bun = assetManager.getBundle(ab);
        if (bun) {
          resolve(bun);
        } else {
          assetManager.loadBundle(ab, (err, bun) => {
            if (err) {
              this.loader.logger.e(`资源包 ⁅${ab}⁆ 加载失败`, err);
              resolve(null);
            } else {
              resolve(bun);
            }
          });
        }
      }
    });
  }

  unloadAB(ab: string, releaseAll: boolean = false) {
    const bun = assetManager.getBundle(ab);
    if (bun) {
      if (releaseAll) {
        bun.releaseAll();
      }
      assetManager.removeBundle(bun);
    }
  }

  has(path: string) {
    return new Promise<boolean>(async (resolve) => {
      if (this._parsed.has(path)) {
        return resolve(this._parsed.get(path)!);
      }

      const [ab, raw] = this.parsePath(path);
      const bun = await this.loadAB(ab);
      if (bun) {
        const info = bun.getInfoWithPath(raw);
        const exists = info == null ? false : true;
        this._parsed.set(path, exists);
        resolve(exists);
      } else {
        this._parsed.set(path, false);
        resolve(false);
      }
    });
  }

  preload<T extends Asset>(type: Constructor<T>, path: string) {
    return new Promise<boolean>(async (resolve) => {
      const exists = await this.has(path);
      if (!exists) return resolve(false);

      const [ab, raw] = this.parsePath(path);
      const bun = await this.loadAB(ab);
      if (bun) {
        let url = raw;
        const typeName = js.getClassName(type);
        if (typeName === 'cc.SpriteFrame') {
          url += '/spriteFrame';
        } else if (typeName === 'cc.Texture2D') {
          url += '/texture';
        }
        const info = bun.getInfoWithPath(url, type);
        if (info) {
          bun.preload(url, type, (err, data) => {
            resolve(err ? false : true);
          });
        }
      }
    });
  }

  load<T extends Asset>(type: Constructor<T>, path: string) {
    return new Promise<T | null>(async (resolve) => {
      const exists = await this.has(path);
      if (!exists) return resolve(null);

      const [ab, raw] = this.parsePath(path);
      const bun = await this.loadAB(ab);
      if (bun) {
        let url = raw;
        const typeName = js.getClassName(type);
        if (typeName === 'cc.SpriteFrame') {
          url += '/spriteFrame';
        } else if (typeName === 'cc.Texture2D') {
          url += '/texture';
        }
        const info = bun.getInfoWithPath(url, type);
        if (info) {
          bun.load(url, type, (err, res) => {
            if (err) {
              this.loader.logger.e(`资源 l:⁅${ab}@${url}⁆ 加载失败`);
              resolve(null);
            } else {
              resolve(res);
            }
          });
        } else {
          this.loader.logger.e(`资源 l:⁅${ab}@${url}⁆ 加载失败`);
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  }

  loadImage(path: string) {
    return this.load<ImageAsset>(ImageAsset, path);
  }

  loadTexture(path: string) {
    return this.load(Texture2D, path);
  }

  loadSpriteFrame(path: string) {
    return this.load(SpriteFrame, path);
  }

  loadAtlas(path: string) {
    return this.load(SpriteAtlas, path);
  }

  loadPrefab(path: string) {
    return this.load(Prefab, path);
  }

  loadText(path: string) {
    return this.load(TextAsset, path);
  }

  loadJson(path: string) {
    return this.load(JsonAsset, path);
  }

  loadSpine(path: string) {
    return this.load(sp.SkeletonData, path);
  }

  loadFont(path: string) {
    return this.load(TTFFont, path);
  }

  loadBitmapFont(path: string) {
    return this.load(BitmapFont, path);
  }

  loadAudio(path: string) {
    return this.load(AudioClip, path);
  }

  loadParticle(path: string) {
    return this.load(ParticleAsset, path);
  }

  loadTmx(path: string) {
    return this.load(TiledMapAsset, path);
  }

  loadBinary(path: string) {
    return this.load(BufferAsset, path);
  }

  loadVideo(path: string) {
    return this.load(VideoClip, path);
  }

  loadAnimation(path: string) {
    return this.load(AnimationClip, path);
  }
}

/**
 * 远程资源容器
 */
export class ResRemote implements IResRemote {
  /** 携带参数 */
  private _params: Record<string, string> = Object.create(null);

  constructor(public readonly loader: ResLoaderPlugin) {}

  /** 资源服务器地址 */
  public get server() {
    return assetManager.downloader.remoteServerAddress;
  }
  public set server(value: string) {
    // @ts-ignore
    assetManager.downloader._remoteServerAddress = value;
  }

  public clear() {
    this.loader.of<IResCachePlugin>(PRESET_TOKEN.RES_CACHE).clearBySource(ResCacheSource.Remote);
  }

  /**
   * 创建图像资源
   * @param img 原始图像
   * @returns
   */
  public createImageAsset(img: __private._cocos_asset_assets_image_asset__ImageSource) {
    return img instanceof ImageAsset ? img : new ImageAsset(img);
  }

  /** 获取图集名称 */
  public getAtlasName(atlas: string) {
    const matches = atlas.match(/[\w\-_]+\.png/);
    if (matches) return matches[0];
    return '';
  }

  /** 解析矩形信息 TexturePacker */
  public parseRect(rect: string) {
    rect = rect.replace(/[\{\}]/g, '');
    const rectArr = rect.split(',').map(parseFloat);
    return new Rect(...rectArr);
  }

  /**
   * 添加参数
   * @param key 键
   * @param val 值
   */
  public appendParam(key: string, val: string) {
    this._params[key] = val;
  }

  /**
   * 设置参数
   * @param params 参数
   */
  public setParams(params: Record<string, string>) {
    this.clearParams();
    Object.keys(params).forEach((k) => {
      this._params[k] = params[k];
    });
  }

  /** 清空参数 */
  public clearParams() {
    Object.keys(this._params).forEach((k) => {
      delete this._params[k];
    });
  }

  /**
   * 加载资源
   * @param key 别名
   * @param urls 资源路径
   * @param parser 解析器
   * @returns
   */
  private internalLoad<T extends Asset>(key: string, urls: string | string[], parser: (asset: any) => T) {
    return new Promise<T | null>((resolve) => {
      const cacheKey = 'r:' + key;
      let asset: T | null = this.loader.of<IResCachePlugin>(PRESET_TOKEN.RES_CACHE).get<T>(cacheKey);
      if (asset) {
        return resolve(asset as T);
      }
      if (!Array.isArray(urls)) urls = [urls];
      const ret = urls.map((v) => {
        return { url: this.makeUrl(v) };
      });
      assetManager.loadAny(ret, null, (err, data) => {
        if (data) {
          asset = parser(data!);
        }
        return resolve(asset as T | null);
      });
    });
  }

  /**
   * 组织网址
   * @param raw 资源地址
   * @returns
   */
  public makeUrl(raw: string) {
    const params: string[] = [];

    const keys = Object.keys(this._params);
    if (keys.length > 0) {
      keys.forEach((k) => {
        params.push(`${k}=${this._params[k]}`);
      });
    }

    let url = path.join(this.server, raw);
    if (params.length) {
      url += '?' + params.join('&');
    }

    return url;
  }

  /** 原始网址 */
  public nativeUrlOf(url: string) {
    return path.join(this.server, url);
  }

  /**
   * 加载音频切片
   * @param url 资源路径
   * @returns
   */
  public loadAudio(url: string) {
    const urls = [url];
    return this.internalLoad<AudioClip>(url, urls, (nativeAsset) => {
      const asset = new AudioClip();
      asset._nativeAsset = nativeAsset;
      asset._uuid = asset._nativeUrl = this.nativeUrlOf(urls[0]);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [],
        nativeDep: [nativeAsset],
      });
      return asset;
    });
  }

  /**
   * 加载二进制文件
   * @param url 资源路径
   * @returns
   */
  public loadBinary(url: string) {
    const urls = [url];
    return this.internalLoad<BufferAsset>(url, urls, (nativeAsset) => {
      const asset = new BufferAsset();
      asset._nativeAsset = nativeAsset;
      asset._uuid = asset._nativeUrl = this.nativeUrlOf(urls[0]);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [],
        nativeDep: [nativeAsset],
      });
      return asset;
    });
  }

  /**
   * 加载 astc 图像
   * @param url 资源路径
   * @returns
   */
  public loadASTC(url: string) {
    const urls = [url];
    return this.internalLoad<SpriteFrame>(url, urls, (nativeAsset) => {
      const info = sys.isBrowser ? nativeAsset : nativeAsset.file;
      const image = this.loader.of<IResAstcPlugin>(PRESET_TOKEN.RES_ASTC).createImageAsset(info);
      if (!image) return null as unknown as SpriteFrame;
      const asset = SpriteFrame.createWithImage(image);
      const uuid = this.nativeUrlOf(urls[0]);
      asset._nativeAsset = nativeAsset;
      image._uuid = uuid + '/image';
      asset._uuid = asset._nativeUrl = uuid;
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [],
        nativeDep: [nativeAsset],
      });
      return asset;
    });
  }

  /**
   * 加载 ttf 字体
   * @param url 资源路径
   * @returns
   */
  public loadTTFFont(url: string) {
    const urls = [url];
    return this.internalLoad<TTFFont>(url, urls, (nativeAsset) => {
      const asset = new TTFFont();
      asset._nativeAsset = nativeAsset;
      asset._uuid = asset._nativeUrl = this.nativeUrlOf(urls[0]);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [],
        nativeDep: [nativeAsset],
      });
      return asset;
    });
  }

  /**
   * 加载位图字体
   * @param url 资源路径
   */
  public loadBitmapFont(url: string) {
    const ext = path.extname(url);
    const urls = [url, url.replace(ext, '.json')];
    return this.internalLoad<BitmapFont>(url, urls, (natives) => {
      const [nImage, nJson] = natives;
      const image = this.createImageAsset(nImage);
      const frame = SpriteFrame.createWithImage(image);
      const asset = new BitmapFont();
      const uuid = this.nativeUrlOf(urls[0]);
      asset.fntConfig = nJson;
      asset.spriteFrame = frame;
      asset._nativeAsset = nImage;
      image._uuid = uuid + '/image';
      frame._uuid = uuid + '/spriteFrame';
      asset._uuid = asset._nativeUrl = uuid;
      assetManager.assets.add(image._uuid, image);
      assetManager.assets.add(frame._uuid, frame);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [frame._uuid, image._uuid],
        nativeDep: [nImage, nJson],
      });
      return asset;
    });
  }

  /**
   * 加载图片
   * @param url 资源路径
   * @returns
   */
  public loadImage(url: string) {
    const urls = [url];
    return this.internalLoad<ImageAsset>(url, urls, (native) => {
      const asset = this.createImageAsset(native);
      asset._nativeAsset = native;
      asset._uuid = asset._nativeUrl = this.nativeUrlOf(urls[0]);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [],
        nativeDep: [native],
      });
      return asset;
    });
  }

  /**
   * 加载 JSON
   * @param url 资源路径
   * @returns
   */
  public loadJson(url: string) {
    const urls = [url];
    return this.internalLoad<JsonAsset>(url, urls, (native) => {
      const asset = new JsonAsset();
      asset.json = native;
      asset._nativeAsset = native;
      asset._uuid = asset._nativeUrl = this.nativeUrlOf(urls[0]);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [],
        nativeDep: [native],
      });
      return asset;
    });
  }

  /**
   * 加载骨骼动画
   * @param url 资源路径
   * @returns
   */
  public loadSpine(url: string) {
    const ext = path.extname(url);
    const urls = [url, url.replace(ext, '.json'), url.replace(ext, '.atlas')];
    return this.internalLoad<sp.SkeletonData>(url, urls, (natives) => {
      const [nImage, nAtlas, nJsonOrBin] = natives;
      const image = this.createImageAsset(nImage);
      const tex = new Texture2D();
      const asset = new sp.SkeletonData();
      const uuid = this.nativeUrlOf(urls[0]);
      tex.image = image;
      asset._nativeAsset = nJsonOrBin;
      if (ext == '.json') asset.skeletonJson = nJsonOrBin;
      asset.atlasText = nAtlas;
      asset.textures = [tex];
      asset.textureNames = [this.getAtlasName(nAtlas)];
      image._uuid = uuid + '/image';
      tex._uuid = uuid + '/texture';
      asset._uuid = asset._nativeUrl = uuid;
      assetManager.assets.add(image._uuid, image);
      assetManager.assets.add(tex._uuid, tex);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [tex._uuid, image._uuid],
        nativeDep: [nImage, nAtlas, nJsonOrBin],
      });
      return asset;
    });
  }

  /**
   * 加载图集
   * @param url 资源路径
   * @returns
   */
  public loadSpriteAtlas(url: string) {
    const ext = path.extname(url);
    const urls = [url, url.replace(ext, '.plist')];
    return this.internalLoad<SpriteAtlas>(url, urls, (native) => {
      const [nImage, nPlist] = native;
      const image = this.createImageAsset(nImage);
      const tex = new Texture2D();
      const asset = new SpriteAtlas();
      const spriteFrames = [];
      const spriteFramesMap: Record<string, SpriteFrame> = {};
      const uuid = this.nativeUrlOf(urls[0]);
      tex.image = image;
      Object.keys(nPlist.frames).forEach((k) => {
        const frame = new SpriteFrame();
        const data = nPlist.frames[k];
        frame.texture = tex;
        if (data.textureRect) {
          frame.rect = this.parseRect(data.textureRect);
        } else if (data.frame) {
          frame.rect = new Rect(data.frame.x, data.frame.y, data.frame.w, data.frame.h);
        } else {
          frame.rect = new Rect(data.x, data.y, data.w, data.h);
        }
        spriteFrames.push(frame);
        spriteFramesMap[k] = frame;
        frame._uuid = uuid + '/spriteFrame/' + k;
      });
      asset.spriteFrames = spriteFramesMap;
      asset._nativeAsset = nImage;
      image._uuid = uuid + '/image';
      tex._uuid = uuid + '/texture';
      asset._uuid = asset._nativeUrl = uuid;
      assetManager.assets.add(image._uuid, image);
      assetManager.assets.add(tex._uuid, tex);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [tex._uuid, image._uuid],
        nativeDep: [nImage, nPlist],
      });
      return asset;
    });
  }

  /**
   * 加载精灵
   * @param url 资源路径
   * @returns
   */
  public loadSpriteFrame(url: string) {
    const urls = [url];
    return this.internalLoad<SpriteFrame>(url, urls, (native) => {
      const image = this.createImageAsset(native);
      const asset = SpriteFrame.createWithImage(image);
      const uuid = this.nativeUrlOf(urls[0]);
      asset._nativeAsset = native;
      image._uuid = uuid + '/image';
      asset._uuid = asset._nativeUrl = uuid;
      assetManager.assets.add(image._uuid, image);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [image.uuid],
        nativeDep: [native],
      });
      return asset;
    });
  }

  /**
   * 加载文本
   * @param url 资源路径
   * @returns
   */
  public loadText(url: string) {
    const urls = [url];
    return this.internalLoad<TextAsset>(url, urls, (native) => {
      const asset = new TextAsset();
      asset.text = native;
      asset._nativeAsset = native;
      asset._uuid = asset._nativeUrl = this.nativeUrlOf(urls[0]);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [],
        nativeDep: [native],
      });
      return asset;
    });
  }

  /**
   * 加载纹理
   * @param url 资源路径
   * @returns
   */
  public loadTexture(url: string) {
    const urls = [url];
    return this.internalLoad<Texture2D>(url, urls, (native) => {
      const image = this.createImageAsset(native);
      const asset = new Texture2D();
      const uuid = this.nativeUrlOf(urls[0]);
      asset.image = image;
      asset._nativeAsset = native;
      image._uuid = uuid + '/image';
      asset._uuid = asset._nativeUrl = uuid;
      assetManager.assets.add(image._uuid, image);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [image._uuid],
        nativeDep: [native],
      });
      return asset;
    });
  }

  /**
   * 加载视频切片
   * @param url 资源路径
   * @returns
   */
  public loadVideo(url: string) {
    const urls = [url];
    return this.internalLoad<VideoClip>(url, urls, (native) => {
      const asset = new VideoClip();
      asset._nativeAsset = native;
      asset._uuid = asset._nativeUrl = this.nativeUrlOf(urls[0]);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [],
        nativeDep: [native],
      });
      return asset;
    });
  }

  /**
   * 加载远程资源
   * @param type 资源类型
   * @param path 资源路径
   * @returns 资源实例
   */
  async load<T extends Asset>(type: Constructor<T>, path: string): Promise<T | null> {
    const typeName = js.getClassName(type);
    // 根据类型调用对应的远程加载方法
    switch (typeName) {
      case 'cc.ImageAsset':
        return (await this.loadImage(path)) as unknown as T | null;
      case 'cc.SpriteFrame':
        return (await this.loadSpriteFrame(path)) as unknown as T | null;
      case 'cc.SpriteAtlas':
        return (await this.loadSpriteAtlas(path)) as unknown as T | null;
      case 'cc.Texture2D':
        return (await this.loadTexture(path)) as unknown as T | null;
      case 'cc.TextAsset':
        return (await this.loadText(path)) as unknown as T | null;
      case 'cc.JsonAsset':
        return (await this.loadJson(path)) as unknown as T | null;
      case 'sp.SkeletonData':
        return (await this.loadSpine(path)) as unknown as T | null;
      case 'cc.TTFFont':
        return (await this.loadTTFFont(path)) as unknown as T | null;
      case 'cc.BitmapFont':
        return (await this.loadBitmapFont(path)) as unknown as T | null;
      case 'cc.AudioClip':
        return (await this.loadAudio(path)) as unknown as T | null;
      case 'cc.BufferAsset':
        return (await this.loadBinary(path)) as unknown as T | null;
      case 'cc.VideoClip':
        return (await this.loadVideo(path)) as unknown as T | null;
      default:
        this.loader.logger.w(`不支持的远程资源类型: ${typeName}`);
        return null;
    }
  }
}

/**
 * 资源加载插件
 * @description 统一管理本地和远程资源的加载，自动处理缓存
 */
export class ResLoaderPlugin extends Plugin implements IResLoaderPlugin {
  public static readonly Token: string = PRESET_TOKEN.RES_LOADER;

  protected readonly $dependencies: string[] = [PRESET_TOKEN.RES_ASTC, PRESET_TOKEN.RES_CACHE];
  public readonly local: ResLocal = new ResLocal(this);
  public readonly remote: ResRemote = new ResRemote(this);

  /**
   * 解析资源路径
   * @param path 资源路径
   * @returns [缓存key, 原始路径]
   */
  private parsePath(path: string): [ResCacheSource, string, string] {
    let raw = path.slice(2);
    if (this.isLocal(path)) {
      raw = this.local.parsePath(raw).join('@');
      return [ResCacheSource.Local, 'l:' + raw, raw];
    } else if (this.isRemote(path)) {
      return [ResCacheSource.Remote, path, raw];
    } else {
      return [ResCacheSource.Unknown, '', ''];
    }
  }

  isRemote(path: string): boolean {
    return path.startsWith('r:');
  }

  isLocal(path: string) {
    return path.startsWith('l:');
  }

  loadBundle(bundle: string): Promise<AssetManager.Bundle | null> {
    return this.local.loadAB(bundle);
  }

  unloadBundle(bundle: string, releaseAll: boolean = false): void {
    // 清理该包的所有缓存
    const cache = this.of<IResCachePlugin>(PRESET_TOKEN.RES_CACHE);
    const prefix = `l:${bundle}@`;
    const keys = cache.keys(ResCacheSource.Local);
    keys.forEach((key) => {
      if (key.startsWith(prefix)) {
        cache.delete(key, true);
      }
    });

    // 卸载资源包
    this.local.unloadAB(bundle, releaseAll);

    this.logger.df(`资源包 ⁅${bundle}⁆ 已加载`);
  }

  async preload(
    items: ResPreloadItem[],
    onProgress?: (finished: number, total: number, path: string, loaded: boolean) => void
  ): Promise<void> {
    const total = items.length;
    let finished = 0;

    for (const item of items) {
      const [type, path] = item;
      const loaded = await this.local.preload(type, path);

      if (loaded) {
        finished++;
      }

      if (onProgress) {
        onProgress(finished, total, path, loaded);
      }

      if (!loaded) {
        this.logger.ef(`资源 ⁅${path}⁆ 预加载失败`);
      }
    }

    this.logger.i(`资源预加载完成: ${finished}/${total}`);
  }

  async load<T extends Asset>(type: Constructor<T>, options: IResLoadOptions): Promise<T | null> {
    const { path, cacheExpires = PRESET_RES.ASSET_EXPIRES_MS } = options;
    const [source, key, raw] = this.parsePath(path);
    if (source == ResCacheSource.Unknown) {
      this.logger.w(`资源 ⁅${path}⁆ 加载失败，跳过无效路径`);
      return null;
    }

    // 检查缓存
    const cache = this.of<IResCachePlugin>(PRESET_TOKEN.RES_CACHE);
    if (cache.has(key)) {
      this.logger.d(`资源 ⁅${key}⁆ 加载命中缓存`);
      return cache.get<T>(key);
    }

    // 加载资源
    let asset: T | null = null;
    if (source == ResCacheSource.Remote) {
      asset = await this.remote.load<T>(type, raw);
    } else {
      asset = await this.local.load<T>(type, raw);
    }

    // 缓存资源
    if (asset && asset.isValid) {
      cache.set({
        key,
        asset,
        source,
        expires: cacheExpires,
        refCount: 0,
      });

      this.logger.i(`资源 ⁅${key}⁆ 已加载并缓存`);
    }

    return asset;
  }

  loadImage(path: string): Promise<ImageAsset | null> {
    return this.load(ImageAsset, { path });
  }

  loadSpriteFrame(path: string): Promise<SpriteFrame | null> {
    return this.load(SpriteFrame, { path });
  }

  loadAtlas(path: string): Promise<SpriteAtlas | null> {
    return this.load(SpriteAtlas, { path });
  }

  loadTexture(path: string): Promise<Texture2D | null> {
    return this.load(Texture2D, { path });
  }

  loadPrefab(path: string): Promise<Prefab | null> {
    return this.load(Prefab, { path });
  }

  loadText(path: string): Promise<TextAsset | null> {
    return this.load(TextAsset, { path });
  }

  loadJson(path: string): Promise<JsonAsset | null> {
    return this.load(JsonAsset, { path });
  }

  loadSpine(path: string): Promise<sp.SkeletonData | null> {
    return this.load(sp.SkeletonData, { path });
  }

  loadFont(path: string): Promise<TTFFont | null> {
    return this.load(TTFFont, { path });
  }

  loadBitmapFont(path: string): Promise<BitmapFont | null> {
    return this.load(BitmapFont, { path });
  }

  loadAudio(path: string): Promise<AudioClip | null> {
    return this.load(AudioClip, { path });
  }

  loadParticle(path: string): Promise<ParticleAsset | null> {
    return this.load(ParticleAsset, { path });
  }

  loadTmx(path: string): Promise<TiledMapAsset | null> {
    return this.load(TiledMapAsset, { path });
  }

  loadBinary(path: string): Promise<BufferAsset | null> {
    return this.load(BufferAsset, { path });
  }

  loadVideo(path: string): Promise<VideoClip | null> {
    return this.load(VideoClip, { path });
  }

  loadAnimation(path: string): Promise<AnimationClip | null> {
    return this.load(AnimationClip, { path });
  }

  release(path: string): void {
    const [source, key] = this.parsePath(path);
    if (source !== ResCacheSource.Unknown) {
      this.of<IResCachePlugin>(PRESET_TOKEN.RES_CACHE).delete(key, true);
    }
  }

  async loadMany(
    items: ResLoadItem[],
    onProgress?: (finished: number, total: number, path?: string, loaded?: boolean) => void
  ): Promise<void> {
    const total = items.length;
    let finished = 0;
    let finishedList = [];

    for (const item of items) {
      const [type, options] = item;
      const asset = await this.load(type, options);
      const url = this.parsePath(options.path)[1];

      if (asset) {
        finished++;
        finishedList.push('✅ ' + url);
      } else {
        finishedList.push('❌ ' + url);
        this.logger.e(`资源 ⁅${url}⁆ 加载失败`);
      }

      if (onProgress) {
        onProgress(finished, total, url, asset != null);
      }
    }

    this.logger.i(`资源加载完成：${finished}/${total}`, finishedList);
  }

  loadBatch(items: ResLoadItem[]) {
    return Promise.allSettled(items.map((v) => this.load(...v)));
  }

  loadSequence(
    tasks: ResLoadItem[],
    onProgress?: (finished: number, total: number, path: string, success: boolean) => void,
    onComplete?: (finished: number, total: number) => void | Promise<void>
  ): () => void {
    const total = tasks.length;
    let index = 0;
    let finished = 0;
    let aborted = false;
    let current: IResLoadTask<Asset> | undefined = undefined;

    const next = () => {
      if (aborted) {
        return;
      }

      if (index >= total) {
        onComplete?.(finished, total);
        return;
      }

      const task = tasks[index++];
      const [type, options] = task;
      current = new ResLoadTask(this, type, options, (asset) => {
        if (asset) {
          finished++;
        }

        const url = this.parsePath(options.path)[1];

        if (onProgress) {
          onProgress(finished, total, url, asset != null);
        }

        if (!asset) {
          this.logger.e(`资源 ⁅${url}⁆ 加载失败`);
        }

        next();
      });
      current.load();
    };

    next();

    return function abort() {
      if (!aborted) {
        aborted = true;
        current?.abort();
        current = undefined;
      }
    };
  }

  loadParallel(
    items: ResLoadItem[],
    onProgress?: (finished: number, total: number, path: string, success: boolean) => void,
    onComplete?: (finished: number, total: number) => void,
    concurrency: number = 0
  ) {
    let finished = 0;
    let total = items.length;
    let aborted = false;

    if (concurrency <= 0) {
      const tasks = items.map(
        (item) =>
          new ResLoadTask(this, ...item, (asset) => {
            finished++;

            const options = item[1];
            const url = this.parsePath(options.path)[1];

            if (onProgress) {
              onProgress(finished, total, url, asset != null);
            }

            if (finished >= total && onComplete) {
              onComplete(finished, total);
            }

            if (!asset) {
              this.logger.e(`资源 ⁅${url}⁆ 加载失败`);
            }
          })
      );
      tasks.forEach((task) => task.load());

      return function abort() {
        if (!aborted) {
          aborted = true;
          tasks.forEach((task) => task.abort());
        }
      };
    } else {
      const tasks = items.map(
        (item) =>
          new ResLoadTask(this, ...item, (asset) => {
            finished++;

            const options = item[1];
            const url = this.parsePath(options.path)[1];

            if (onProgress) {
              onProgress(finished, total, url, asset != null);
            }

            if (finished >= total && onComplete) {
              onComplete(finished, total);
            }

            if (!asset) {
              this.logger.e(`资源 ⁅${url}⁆ 加载失败`);
            }
          })
      );

      const queue = list.split(tasks, concurrency);
      const next = () => {
        if (aborted) return;
        const tasks = queue.shift();
        if (tasks) {
          tasks.forEach((v) => v.load());
        }
      };

      next();

      return function abort() {
        if (!aborted) {
          aborted = true;
          queue.forEach((tasks) => {
            tasks.forEach((task) => {
              task.abort();
            });
          });
        }
      };
    }
  }
}
