import mitt, { type Emitter } from "mitt";
import { System } from "sdl3";

import { type SDLEventMap, eventTypeToKey, SDL_EVENT_MAP_KEY_SET } from "./game_events.ts";

type GameEvents = {
    Frame: number;
};

export class Game {
    private static _instance: Game | null;

    private _system: System;
    private sdlEvents: Emitter<SDLEventMap>;
    private gameEvents: Emitter<GameEvents>;
    private running: boolean = false;

    public constructor() {
        if (Game._instance) {
            throw new Error("Only one Game instance can be created at time.");
        } else {
            Game._instance = this;
        }

        this._system = new System();
        this.sdlEvents = mitt<SDLEventMap>();
        this.gameEvents = mitt<GameEvents>();
    }

    public dispose(): void {
        if (Game._instance) {
            this._system.dispose();
            Game._instance = null;
        }
    }

    public [Symbol.dispose](): void {
        this.dispose();
    }

    public get system(): System {
        return this._system;
    }

    public on<K extends keyof SDLEventMap>(event: K, handler: (e: SDLEventMap[K]) => void): void;
    public on<K extends keyof GameEvents>(event: K, handler: (e: GameEvents[K]) => void): void;
    public on(event: keyof SDLEventMap | keyof GameEvents, handler: (e: never) => void): void {
        if (SDL_EVENT_MAP_KEY_SET.has(event as string)) {
            this.sdlEvents.on(event as keyof SDLEventMap, handler as never);
        } else {
            this.gameEvents.on(event as keyof GameEvents, handler as never);
        }
    }

    public off<K extends keyof SDLEventMap>(event: K, handler: (e: SDLEventMap[K]) => void): void;
    public off<K extends keyof GameEvents>(event: K, handler: (e: GameEvents[K]) => void): void;
    public off(event: keyof SDLEventMap | keyof GameEvents, handler: (e: never) => void): void {
        if (SDL_EVENT_MAP_KEY_SET.has(event as string)) {
            this.sdlEvents.off(event as keyof SDLEventMap, handler as never);
        } else {
            this.gameEvents.off(event as keyof GameEvents, handler as never);
        }
    }

    public get isRunning(): boolean {
        return this.running;
    }

    public exit(): void {
        this.running = false;
    }

    public run(): void {
        this.running = true;

        while (this.running) {
            for (const e of this._system.events()) {
                const key = eventTypeToKey(e.type);
                if (key !== undefined) {
                    this.sdlEvents.emit(key, e as never);
                }
            }

            this.gameEvents.emit("Frame", 0);
        }
    }
}
