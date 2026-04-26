import type {
    AudioDeviceEvent,
    CameraDeviceEvent,
    ClipboardEvent,
    DisplayEvent,
    DropEvent,
    GamepadAxisEvent,
    GamepadButtonEvent,
    GamepadDeviceEvent,
    GamepadSensorEvent,
    GamepadTouchpadEvent,
    JoyAxisEvent,
    JoyBallEvent,
    JoyBatteryEvent,
    JoyButtonEvent,
    JoyDeviceEvent,
    JoyHatEvent,
    KeyboardDeviceEvent,
    KeyboardEvent,
    MouseButtonEvent,
    MouseDeviceEvent,
    MouseMotionEvent,
    MouseWheelEvent,
    PenAxisEvent,
    PenButtonEvent,
    PenMotionEvent,
    PenProximityEvent,
    PenTouchEvent,
    QuitEvent,
    RenderEvent,
    SensorEvent,
    TextEditingCandidatesEvent,
    TextEditingEvent,
    TextInputEvent,
    TouchFingerEvent,
    WindowEvent,
} from "sdl3";
import { EventType } from "sdl3";

export type SDLEventMap = {
    // Application
    Quit: QuitEvent;

    // Display
    DisplayOrientation: DisplayEvent;
    DisplayAdded: DisplayEvent;
    DisplayRemoved: DisplayEvent;
    DisplayMoved: DisplayEvent;
    DisplayDesktopModeChanged: DisplayEvent;
    DisplayCurrentModeChanged: DisplayEvent;
    DisplayContentScaleChanged: DisplayEvent;

    // Window
    WindowShown: WindowEvent;
    WindowHidden: WindowEvent;
    WindowExposed: WindowEvent;
    WindowMoved: WindowEvent;
    WindowResized: WindowEvent;
    WindowPixelSizeChanged: WindowEvent;
    WindowMetalViewResized: WindowEvent;
    WindowMinimized: WindowEvent;
    WindowMaximized: WindowEvent;
    WindowRestored: WindowEvent;
    WindowMouseEnter: WindowEvent;
    WindowMouseLeave: WindowEvent;
    WindowFocusGained: WindowEvent;
    WindowFocusLost: WindowEvent;
    WindowCloseRequested: WindowEvent;
    WindowHitTest: WindowEvent;
    WindowIccprofChanged: WindowEvent;
    WindowDisplayChanged: WindowEvent;
    WindowDisplayScaleChanged: WindowEvent;
    WindowSafeAreaChanged: WindowEvent;
    WindowOccluded: WindowEvent;
    WindowEnterFullscreen: WindowEvent;
    WindowLeaveFullscreen: WindowEvent;
    WindowDestroyed: WindowEvent;
    WindowHdrStateChanged: WindowEvent;

    // Keyboard
    KeyDown: KeyboardEvent;
    KeyUp: KeyboardEvent;
    TextEditing: TextEditingEvent;
    TextEditingCandidates: TextEditingCandidatesEvent;
    TextInput: TextInputEvent;
    KeymapChanged: void;
    KeyboardAdded: KeyboardDeviceEvent;
    KeyboardRemoved: KeyboardDeviceEvent;

    // Mouse
    MouseMotion: MouseMotionEvent;
    MouseButtonDown: MouseButtonEvent;
    MouseButtonUp: MouseButtonEvent;
    MouseWheel: MouseWheelEvent;
    MouseAdded: MouseDeviceEvent;
    MouseRemoved: MouseDeviceEvent;

    // Joystick
    JoystickAxisMotion: JoyAxisEvent;
    JoystickBallMotion: JoyBallEvent;
    JoystickHatMotion: JoyHatEvent;
    JoystickButtonDown: JoyButtonEvent;
    JoystickButtonUp: JoyButtonEvent;
    JoystickAdded: JoyDeviceEvent;
    JoystickRemoved: JoyDeviceEvent;
    JoystickBatteryUpdated: JoyBatteryEvent;
    JoystickUpdateComplete: JoyDeviceEvent;

    // Gamepad
    GamepadAxisMotion: GamepadAxisEvent;
    GamepadButtonDown: GamepadButtonEvent;
    GamepadButtonUp: GamepadButtonEvent;
    GamepadAdded: GamepadDeviceEvent;
    GamepadRemoved: GamepadDeviceEvent;
    GamepadRemapped: GamepadDeviceEvent;
    GamepadTouchpadDown: GamepadTouchpadEvent;
    GamepadTouchpadMotion: GamepadTouchpadEvent;
    GamepadTouchpadUp: GamepadTouchpadEvent;
    GamepadSensorUpdate: GamepadSensorEvent;
    GamepadUpdateComplete: GamepadDeviceEvent;
    GamepadSteamHandleUpdated: GamepadDeviceEvent;

    // Touch
    FingerDown: TouchFingerEvent;
    FingerUp: TouchFingerEvent;
    FingerMotion: TouchFingerEvent;
    FingerCanceled: TouchFingerEvent;

    // Clipboard
    ClipboardUpdate: ClipboardEvent;

    // Drag and drop
    DropFile: DropEvent;
    DropText: DropEvent;
    DropBegin: DropEvent;
    DropComplete: DropEvent;
    DropPosition: DropEvent;

    // Audio
    AudioDeviceAdded: AudioDeviceEvent;
    AudioDeviceRemoved: AudioDeviceEvent;
    AudioDeviceFormatChanged: AudioDeviceEvent;

    // Sensor
    SensorUpdate: SensorEvent;

    // Pen
    PenProximityIn: PenProximityEvent;
    PenProximityOut: PenProximityEvent;
    PenDown: PenTouchEvent;
    PenUp: PenTouchEvent;
    PenButtonDown: PenButtonEvent;
    PenButtonUp: PenButtonEvent;
    PenMotion: PenMotionEvent;
    PenAxis: PenAxisEvent;

    // Camera
    CameraDeviceAdded: CameraDeviceEvent;
    CameraDeviceRemoved: CameraDeviceEvent;
    CameraDeviceApproved: CameraDeviceEvent;
    CameraDeviceDenied: CameraDeviceEvent;

    // Render
    RenderTargetsReset: RenderEvent;
    RenderDeviceReset: RenderEvent;
    RenderDeviceLost: RenderEvent;
};

// Enforces all SDLEventMap keys are accounted for at compile time
const SDL_EVENT_MAP_KEYS = {
    Quit: true,
    DisplayOrientation: true,
    DisplayAdded: true,
    DisplayRemoved: true,
    DisplayMoved: true,
    DisplayDesktopModeChanged: true,
    DisplayCurrentModeChanged: true,
    DisplayContentScaleChanged: true,
    WindowShown: true,
    WindowHidden: true,
    WindowExposed: true,
    WindowMoved: true,
    WindowResized: true,
    WindowPixelSizeChanged: true,
    WindowMetalViewResized: true,
    WindowMinimized: true,
    WindowMaximized: true,
    WindowRestored: true,
    WindowMouseEnter: true,
    WindowMouseLeave: true,
    WindowFocusGained: true,
    WindowFocusLost: true,
    WindowCloseRequested: true,
    WindowHitTest: true,
    WindowIccprofChanged: true,
    WindowDisplayChanged: true,
    WindowDisplayScaleChanged: true,
    WindowSafeAreaChanged: true,
    WindowOccluded: true,
    WindowEnterFullscreen: true,
    WindowLeaveFullscreen: true,
    WindowDestroyed: true,
    WindowHdrStateChanged: true,
    KeyDown: true,
    KeyUp: true,
    TextEditing: true,
    TextEditingCandidates: true,
    TextInput: true,
    KeymapChanged: true,
    KeyboardAdded: true,
    KeyboardRemoved: true,
    MouseMotion: true,
    MouseButtonDown: true,
    MouseButtonUp: true,
    MouseWheel: true,
    MouseAdded: true,
    MouseRemoved: true,
    JoystickAxisMotion: true,
    JoystickBallMotion: true,
    JoystickHatMotion: true,
    JoystickButtonDown: true,
    JoystickButtonUp: true,
    JoystickAdded: true,
    JoystickRemoved: true,
    JoystickBatteryUpdated: true,
    JoystickUpdateComplete: true,
    GamepadAxisMotion: true,
    GamepadButtonDown: true,
    GamepadButtonUp: true,
    GamepadAdded: true,
    GamepadRemoved: true,
    GamepadRemapped: true,
    GamepadTouchpadDown: true,
    GamepadTouchpadMotion: true,
    GamepadTouchpadUp: true,
    GamepadSensorUpdate: true,
    GamepadUpdateComplete: true,
    GamepadSteamHandleUpdated: true,
    FingerDown: true,
    FingerUp: true,
    FingerMotion: true,
    FingerCanceled: true,
    ClipboardUpdate: true,
    DropFile: true,
    DropText: true,
    DropBegin: true,
    DropComplete: true,
    DropPosition: true,
    AudioDeviceAdded: true,
    AudioDeviceRemoved: true,
    AudioDeviceFormatChanged: true,
    SensorUpdate: true,
    PenProximityIn: true,
    PenProximityOut: true,
    PenDown: true,
    PenUp: true,
    PenButtonDown: true,
    PenButtonUp: true,
    PenMotion: true,
    PenAxis: true,
    CameraDeviceAdded: true,
    CameraDeviceRemoved: true,
    CameraDeviceApproved: true,
    CameraDeviceDenied: true,
    RenderTargetsReset: true,
    RenderDeviceReset: true,
    RenderDeviceLost: true,
} as const satisfies Record<keyof SDLEventMap, true>;
//             ^ TypeScript errors here if any GameEventMap key is missing

export const SDL_EVENT_MAP_KEY_SET = new Set<string>(Object.keys(SDL_EVENT_MAP_KEYS));

// Type-level map: EventType numeric values → GameEventMap string keys
type EventTypeToKeyMap = {
    readonly [K in keyof typeof SDL_EVENT_MAP_KEYS as (typeof EventType)[K extends keyof typeof EventType ? K : never]]: K
};

// Overload gives you the literal type when the EventType value is known at compile time
export function eventTypeToKey<T extends keyof EventTypeToKeyMap>(type: T): EventTypeToKeyMap[T];
export function eventTypeToKey(type: EventType): keyof SDLEventMap | undefined;
export function eventTypeToKey(type: EventType): keyof SDLEventMap | undefined {
    const name = EventType[type]; // numeric enum reverse mapping
    return SDL_EVENT_MAP_KEY_SET.has(name) ? name as keyof SDLEventMap : undefined;
}
