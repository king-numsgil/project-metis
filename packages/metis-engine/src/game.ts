import mitt, { type Emitter } from "mitt";
import {
    CommandBuffer,
    Device,
    EventType,
    FlipMode,
    GPUFilter,
    GPULoadOp,
    GPUSampleCount,
    GPUShaderFormat,
    GPUTextureType,
    GPUTextureUsageFlags, Scancode,
    type SDL_WindowFlags,
    System,
    Texture,
    Window,
    type WindowID,
} from "sdl3";
import { sdlGetError, sdlGetKeyboardState } from "sdl3/ffi";

import { eventTypeToKey, SDL_EVENT_MAP_KEY_SET, type SDLEventMap } from "./game_events.ts";

export interface PreFrameContext {
    cb: CommandBuffer;
    dt: number;
    window: WindowID;
}

export interface FrameContext {
    cb: CommandBuffer;
    dt: number;
    window: WindowID;
    texture: Texture | null;
    resolve_texture: Texture | null;
}

type GameEvents = {
    PreFrame: PreFrameContext;
    Frame: FrameContext;
};

interface ManagedWindow {
    window: Window;
    width: number;
    height: number;
    msaa: Texture | null;
    resolve: Texture | null;
}

export class Game {
    private static _instance: Game | null = null;
    public mainWindow: WindowID = 0 as WindowID;
    private readonly _system: System;
    private readonly _device: Device;
    private readonly _keyboard: Uint8Array;
    private sdlEvents: Emitter<SDLEventMap>;
    private gameEvents: Emitter<GameEvents>;
    private running: boolean = false;
    private windows: Map<WindowID, ManagedWindow> = new Map<WindowID, ManagedWindow>();

    public constructor() {
        if (Game._instance) {
            throw new Error("Only one Game instance can be created at time.");
        } else {
            Game._instance = this;
        }

        this._system = new System();
        this._device = new Device(GPUShaderFormat.SPIRV, true);
        this._keyboard = sdlGetKeyboardState();
        this.sdlEvents = mitt<SDLEventMap>();
        this.gameEvents = mitt<GameEvents>();
    }

    public get system(): System {
        return this._system;
    }

    public get device(): Device {
        return this._device;
    }

    public get isRunning(): boolean {
        return this.running;
    }

    public dispose(): void {
        if (Game._instance) {
            this.mainWindow = 0 as WindowID;
            for (const managed of this.windows.values()) {
                if (managed.msaa) {
                    managed.msaa.dispose();
                }
                if (managed.resolve) {
                    managed.resolve.dispose();
                }

                this.device.releaseWindow(managed.window);
                managed.window.dispose();
            }
            this.windows.clear();

            this._device.dispose();
            this._system.dispose();
            Game._instance = null;
        }
    }

    public [Symbol.dispose](): void {
        this.dispose();
    }

    public createWindow(title: string, width: number, height: number): WindowID;
    public createWindow(title: string, width: number, height: number, samples: GPUSampleCount): WindowID;
    public createWindow(title: string, width: number, height: number, samples?: GPUSampleCount, flags?: SDL_WindowFlags): WindowID {
        const wnd = Window.create(title, width, height, flags ?? 0n);
        this.device.claimWindow(wnd);

        const managed: ManagedWindow = {
            window: wnd,
            width,
            height,
            msaa: null,
            resolve: null,
        };

        if (samples && samples as number > 1) {
            managed.msaa = this.device.createTexture({
                type: GPUTextureType.TwoD,
                format: this.device.getSwapchainFormat(wnd),
                width, height,
                layer_count_or_depth: 1, num_levels: 1,
                sample_count: samples,
                usage: GPUTextureUsageFlags.ColorTarget,
            });

            managed.resolve = this.device.createTexture({
                type: GPUTextureType.TwoD,
                format: this.device.getSwapchainFormat(wnd),
                width, height,
                layer_count_or_depth: 1, num_levels: 1,
                sample_count: GPUSampleCount.One,
                usage: GPUTextureUsageFlags.ColorTarget | GPUTextureUsageFlags.Sampler,
            });
        }
        this.windows.set(wnd.windowID, managed);
        return wnd.windowID;
    }

    public window(winId: WindowID): Window {
        if (!this.windows.has(winId)) {
            throw new Error(`Window ${winId} does not exist`);
        }

        return this.windows.get(winId)!.window;
    }

    public isKeyDown(code: Scancode): boolean {
        return this._keyboard[code] === 1;
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

            for (const [windowId, target] of this.windows) {
                const preframe = this.device.acquireCommandBuffer();
                this.gameEvents.emit("PreFrame", {dt: 0, cb: preframe, window: windowId});
                if (!preframe.submit()) {
                    console.log(`Failed to submit preframe command buffer : ${sdlGetError()}`);
                }

                const frame = this.device.acquireCommandBuffer();
                const swapchain = frame.waitAndAcquireSwapchainTexture(target.window);
                this.gameEvents.emit("Frame", {
                    dt: 0,
                    cb: frame,
                    window: windowId,
                    texture: target.msaa,
                    resolve_texture: target.resolve,
                });

                if (target.msaa && target.resolve) {
                    frame.blitTexture({
                        source: {
                            texture: target.resolve.raw,
                            mip_level: 0,
                            layer_or_depth_plane: 0,
                            x: 0,
                            y: 0,
                            w: target.width,
                            h: target.height,
                        },
                        destination: {
                            texture: swapchain.texture,
                            mip_level: 0,
                            layer_or_depth_plane: 0,
                            x: 0,
                            y: 0,
                            w: swapchain.width,
                            h: swapchain.height,
                        },
                        load_op: GPULoadOp.DontCare,
                        filter: GPUFilter.Linear,
                        clear_color: {
                            r: 0,
                            g: 0,
                            b: 0,
                            a: 0,
                        },
                        flip_mode: FlipMode.None,
                        cycle: false,
                    });
                }

                if (!frame.submit()) {
                    console.log(`Failed to submit frame command buffer : ${sdlGetError()}`);
                }
            }
        }
    }
}
