import { PRESET_EVENT_NAME } from 'fast/config/Event';
import { PRESET_RES } from 'fast/config/Res';
import { PRESET_TOKEN } from 'fast/config/Token';
import { Plugin } from 'fast/foundation/Plugin';

import { IAppPlugin } from '../app/IAppPlugin';
import { IEventBusPlugin } from '../event-bus/IEventBusPlugin';
import { INodePoolPlugin } from '../pool/INodePoolPlugin';
import { AudioEntry } from './AudioEntry';
import { IAudioPlayerPlugin } from './IAudioPlayerPlugin';
import { MusicPlayer } from './MusicPlayer';
import { SoundPlayer } from './SoundPlayer';

/**
 * 音频播放服务
 */
export class AudioPlayerPlugin extends Plugin implements IAudioPlayerPlugin {
  static readonly Token: string = PRESET_TOKEN.AUDIO_PLAYER;

  protected readonly $dependencies: string[] = [PRESET_TOKEN.EVENT_BUS, PRESET_TOKEN.NODE_POOL, PRESET_TOKEN.APP];

  music: MusicPlayer;
  sound: SoundPlayer;

  async onInitialize() {
    const root = this.of<IAppPlugin>(PRESET_TOKEN.APP).root;
    const nodePool = this.of<INodePoolPlugin>(PRESET_TOKEN.NODE_POOL);
    nodePool.registerByConstructor(AudioEntry, PRESET_RES.MUSIC_ENTRY_OPTIONS);
    nodePool.registerByConstructor(AudioEntry, PRESET_RES.SOUND_ENTRY_OPTIONS);

    this.music = new MusicPlayer('music');
    this.sound = new SoundPlayer('sound');
    root.insertChild(this.music, 1);
    root.insertChild(this.sound, 2);

    const eventBus = this.of<IEventBusPlugin>(PRESET_TOKEN.EVENT_BUS);
    eventBus.app.on(PRESET_EVENT_NAME.ENTER_FOREGROUND, this.resume, this);
    eventBus.app.on(PRESET_EVENT_NAME.ENTER_BACKGROUND, this.pause, this);
    eventBus.app.on(PRESET_EVENT_NAME.EXIT, this.clearEvents, this);
  }

  /** 清除事件监听 */
  private clearEvents() {
    this.music.stop();
    this.sound.stop();
    this.of<IEventBusPlugin>(PRESET_TOKEN.EVENT_BUS).app.off(undefined, this);
  }

  pause(): void {
    this.music.pause();
    this.sound.pause();
  }

  resume(): void {
    this.music.resume();
    this.sound.resume();
  }

  stop(): void {
    this.music.stop();
    this.sound.stop();
  }
}
