import mitt, { type Emitter } from "mitt";
import { CommandBuffer, EventType, System } from "sdl3";

import { eventTypeToKey, SDL_EVENT_MAP_KEY_SET, type SDLEventMap } from "./game_events.ts";

export interface FrameContext {
    cb?: CommandBuffer;
    dt: number;
}

type GameEvents = {
    PreFrame: FrameContext;
    Frame: FrameContext;
};

export class Game {
    private static _instance: Game | null;
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

    private _system: System;

    public get system(): System {
        return this._system;
    }

    public get isRunning(): boolean {
        return this.running;
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

    public exit(): void {
        this.running = false;
    }

    public run(): void {
        this.running = true;

        while (this.running) {
            for (const e of this._system.events()) {
                const key = eventTypeToKey(e.type);
                if (key !== undefined) {
                    switch (e.type) {
                        // QuitEvent
                        case EventType.Quit:
                            this.sdlEvents.emit(key, e.quit);
                            break;

                        // DisplayEvent
                        case EventType.DisplayOrientation:
                        case EventType.DisplayAdded:
                        case EventType.DisplayRemoved:
                        case EventType.DisplayMoved:
                        case EventType.DisplayDesktopModeChanged:
                        case EventType.DisplayCurrentModeChanged:
                        case EventType.DisplayContentScaleChanged:
                            this.sdlEvents.emit(key, e.display);
                            break;

                        // WindowEvent
                        case EventType.WindowShown:
                        case EventType.WindowHidden:
                        case EventType.WindowExposed:
                        case EventType.WindowMoved:
                        case EventType.WindowResized:
                        case EventType.WindowPixelSizeChanged:
                        case EventType.WindowMetalViewResized:
                        case EventType.WindowMinimized:
                        case EventType.WindowMaximized:
                        case EventType.WindowRestored:
                        case EventType.WindowMouseEnter:
                        case EventType.WindowMouseLeave:
                        case EventType.WindowFocusGained:
                        case EventType.WindowFocusLost:
                        case EventType.WindowCloseRequested:
                        case EventType.WindowHitTest:
                        case EventType.WindowIccprofChanged:
                        case EventType.WindowDisplayChanged:
                        case EventType.WindowDisplayScaleChanged:
                        case EventType.WindowSafeAreaChanged:
                        case EventType.WindowOccluded:
                        case EventType.WindowEnterFullscreen:
                        case EventType.WindowLeaveFullscreen:
                        case EventType.WindowDestroyed:
                        case EventType.WindowHdrStateChanged:
                            this.sdlEvents.emit(key, e.window);
                            break;

                        // KeyboardEvent
                        case EventType.KeyDown:
                        case EventType.KeyUp:
                            this.sdlEvents.emit(key, e.key);
                            break;

                        // KeymapEvent
                        case EventType.KeymapChanged:
                            this.sdlEvents.emit(key, e.common);
                            break;

                        // TextEditingEvent
                        case EventType.TextEditing:
                            this.sdlEvents.emit(key, e.edit);
                            break;

                        // TextEditingCandidatesEvent
                        case EventType.TextEditingCandidates:
                            this.sdlEvents.emit(key, e.edit_candidates);
                            break;

                        // TextInputEvent
                        case EventType.TextInput:
                            this.sdlEvents.emit(key, e.text);
                            break;

                        // KeyboardDeviceEvent
                        case EventType.KeyboardAdded:
                        case EventType.KeyboardRemoved:
                            this.sdlEvents.emit(key, e.kdevice);
                            break;

                        // MouseMotionEvent
                        case EventType.MouseMotion:
                            this.sdlEvents.emit(key, e.motion);
                            break;

                        // MouseButtonEvent
                        case EventType.MouseButtonDown:
                        case EventType.MouseButtonUp:
                            this.sdlEvents.emit(key, e.button);
                            break;

                        // MouseWheelEvent
                        case EventType.MouseWheel:
                            this.sdlEvents.emit(key, e.wheel);
                            break;

                        // MouseDeviceEvent
                        case EventType.MouseAdded:
                        case EventType.MouseRemoved:
                            this.sdlEvents.emit(key, e.mdevice);
                            break;

                        // JoyAxisEvent
                        case EventType.JoystickAxisMotion:
                            this.sdlEvents.emit(key, e.jaxis);
                            break;

                        // JoyBallEvent
                        case EventType.JoystickBallMotion:
                            this.sdlEvents.emit(key, e.jball);
                            break;

                        // JoyHatEvent
                        case EventType.JoystickHatMotion:
                            this.sdlEvents.emit(key, e.jhat);
                            break;

                        // JoyButtonEvent
                        case EventType.JoystickButtonDown:
                        case EventType.JoystickButtonUp:
                            this.sdlEvents.emit(key, e.jbutton);
                            break;

                        // JoyDeviceEvent
                        case EventType.JoystickAdded:
                        case EventType.JoystickRemoved:
                        case EventType.JoystickUpdateComplete:
                            this.sdlEvents.emit(key, e.jdevice);
                            break;

                        // JoyBatteryEvent
                        case EventType.JoystickBatteryUpdated:
                            this.sdlEvents.emit(key, e.jbattery);
                            break;

                        // GamepadAxisEvent
                        case EventType.GamepadAxisMotion:
                            this.sdlEvents.emit(key, e.gaxis);
                            break;

                        // GamepadButtonEvent
                        case EventType.GamepadButtonDown:
                        case EventType.GamepadButtonUp:
                            this.sdlEvents.emit(key, e.gbutton);
                            break;

                        // GamepadDeviceEvent
                        case EventType.GamepadAdded:
                        case EventType.GamepadRemoved:
                        case EventType.GamepadRemapped:
                        case EventType.GamepadUpdateComplete:
                        case EventType.GamepadSteamHandleUpdated:
                            this.sdlEvents.emit(key, e.gdevice);
                            break;

                        // GamepadTouchpadEvent
                        case EventType.GamepadTouchpadDown:
                        case EventType.GamepadTouchpadMotion:
                        case EventType.GamepadTouchpadUp:
                            this.sdlEvents.emit(key, e.gtouchpad);
                            break;

                        // GamepadSensorEvent
                        case EventType.GamepadSensorUpdate:
                            this.sdlEvents.emit(key, e.gsensor);
                            break;

                        // TouchFingerEvent
                        case EventType.FingerDown:
                        case EventType.FingerUp:
                        case EventType.FingerMotion:
                        case EventType.FingerCanceled:
                            this.sdlEvents.emit(key, e.tfinger);
                            break;

                        // ClipboardEvent
                        case EventType.ClipboardUpdate:
                            this.sdlEvents.emit(key, e.clipboard);
                            break;

                        // DropEvent
                        case EventType.DropFile:
                        case EventType.DropText:
                        case EventType.DropBegin:
                        case EventType.DropComplete:
                        case EventType.DropPosition:
                            this.sdlEvents.emit(key, e.drop);
                            break;

                        // AudioDeviceEvent
                        case EventType.AudioDeviceAdded:
                        case EventType.AudioDeviceRemoved:
                        case EventType.AudioDeviceFormatChanged:
                            this.sdlEvents.emit(key, e.adevice);
                            break;

                        // SensorEvent
                        case EventType.SensorUpdate:
                            this.sdlEvents.emit(key, e.sensor);
                            break;

                        // PenProximityEvent
                        case EventType.PenProximityIn:
                        case EventType.PenProximityOut:
                            this.sdlEvents.emit(key, e.pproximity);
                            break;

                        // PenTouchEvent
                        case EventType.PenDown:
                        case EventType.PenUp:
                            this.sdlEvents.emit(key, e.ptouch);
                            break;

                        // PenButtonEvent
                        case EventType.PenButtonDown:
                        case EventType.PenButtonUp:
                            this.sdlEvents.emit(key, e.pbutton);
                            break;

                        // PenMotionEvent
                        case EventType.PenMotion:
                            this.sdlEvents.emit(key, e.pmotion);
                            break;

                        // PenAxisEvent
                        case EventType.PenAxis:
                            this.sdlEvents.emit(key, e.paxis);
                            break;

                        // CameraDeviceEvent
                        case EventType.CameraDeviceAdded:
                        case EventType.CameraDeviceRemoved:
                        case EventType.CameraDeviceApproved:
                        case EventType.CameraDeviceDenied:
                            this.sdlEvents.emit(key, e.cdevice);
                            break;

                        // RenderEvent
                        case EventType.RenderTargetsReset:
                        case EventType.RenderDeviceReset:
                        case EventType.RenderDeviceLost:
                            this.sdlEvents.emit(key, e.render);
                            break;
                    }
                }
            }

            this.gameEvents.emit("Frame", {dt: 0});
        }
    }
}
