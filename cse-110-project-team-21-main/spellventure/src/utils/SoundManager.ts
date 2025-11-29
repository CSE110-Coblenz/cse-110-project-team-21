// src/utils/SoundManager.ts
export type KnownSound = "click" | "beep" | "correct" | "wrong";

class _SoundManager {
    private KEY = "soundEnabled";
    private cache = new Map<string, HTMLAudioElement>();
    private _enabled: boolean;
    private _bridgeInstalled = false;
    private _origPlay?: typeof HTMLMediaElement.prototype.play;

    constructor() {
        this._enabled = localStorage.getItem(this.KEY) !== "false";
    }

    /** 是否开启声音（全局） */
    isEnabled(): boolean {
        return this._enabled;
    }

    /** 设置开关并持久化；顺便同步现有 <audio>/<video> 的 muted */
    setEnabled(v: boolean): void {
        this._enabled = v;
        localStorage.setItem(this.KEY, String(v));
        document.querySelectorAll<HTMLMediaElement>("audio,video").forEach(m => {
        m.muted = !v;
        });
    }

    /** 切换开关并返回新状态 */
    toggle(): boolean {
        this.setEnabled(!this._enabled);
        return this._enabled;
    }

    /** （可选）预加载一批音效 */
    preload(names: KnownSound[]): void {
        names.forEach((n) => this.ensure(n));
    }

    /** 主动播放（显式调用型，仍然可用） */
    async play(name: KnownSound): Promise<void> {
        if (!this._enabled) return;
        const a = this.ensure(name);
        if (!a) return;
        try {
        a.currentTime = 0;
        await a.play();
        } catch {
        /* ignore */
        }
    }

    /** 安装“全局拦截器”：统一接管所有 audio.play() */
    installGlobalBridge(): void {
        if (this._bridgeInstalled) return;
        this._bridgeInstalled = true;

        const proto = HTMLMediaElement.prototype;
        if (!this._origPlay) this._origPlay = proto.play;

        const manager = this;
        proto.play = function (...args: any[]) {
        if (!manager._enabled) {
            // 关音时，返回已解决的 Promise，避免调用方报错
            return Promise.resolve() as any;
        }
        try {
            // 短音效从头播
            try { (this as HTMLMediaElement).currentTime = 0; } catch {}
            return manager._origPlay!.apply(this, args as any);
        } catch (e) {
            return Promise.reject(e) as any;
        }
        };
    }

    /** 内部：缓存/加载音频，尝试多种后缀 */
    private ensure(name: string): HTMLAudioElement | undefined {
        if (this.cache.has(name)) return this.cache.get(name);
        const candidates = [
        `/sounds/${name}.ogg`,
        `/sounds/${name}.mp3`,
        `/sounds/${name}.wav`,
        ];
        for (const src of candidates) {
        try {
            const a = new Audio(src);
            a.preload = "auto";
            a.load();
            this.cache.set(name, a);
            return a;
        } catch {
            /* next */
        }
        }
        return undefined;
    }
}

export const SoundManager = new _SoundManager();
