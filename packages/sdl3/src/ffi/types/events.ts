import { Keycode, Keymod } from "./keycode.ts";
import type { WindowID } from "./video.ts";
import { Scancode } from "./scancode.ts";

export enum EventType {
    First = 0,

    // Application events
    Quit = 0x100,
    Terminating,
    LowMemory,
    WillEnterBackground,
    DidEnterBackground,
    WillEnterForeground,
    DidEnterForeground,
    LocaleChanged,
    SystemThemeChanged,

    // Display events
    DisplayOrientation = 0x151,
    DisplayAdded,
    DisplayRemoved,
    DisplayMoved,
    DisplayDesktopModeChanged,
    DisplayCurrentModeChanged,
    DisplayContentScaleChanged,

    // Window events
    WindowShown = 0x202,
    WindowHidden,
    WindowExposed,
    WindowMoved,
    WindowResized,
    WindowPixelSizeChanged,
    WindowMetalViewResized,
    WindowMinimized,
    WindowMaximized,
    WindowRestored,
    WindowMouseEnter,
    WindowMouseLeave,
    WindowFocusGained,
    WindowFocusLost,
    WindowCloseRequested,
    WindowHitTest,
    WindowIccprofChanged,
    WindowDisplayChanged,
    WindowDisplayScaleChanged,
    WindowSafeAreaChanged,
    WindowOccluded,
    WindowEnterFullscreen,
    WindowLeaveFullscreen,
    WindowDestroyed,
    WindowHdrStateChanged,

    // Keyboard events
    KeyDown = 0x300,
    KeyUp,
    TextEditing,
    TextInput,
    KeymapChanged,
    KeyboardAdded,
    KeyboardRemoved,
    TextEditingCandidates,

    // Mouse events
    MouseMotion = 0x400,
    MouseButtonDown,
    MouseButtonUp,
    MouseWheel,
    MouseAdded,
    MouseRemoved,

    // Joystick events
    JoystickAxisMotion = 0x600,
    JoystickBallMotion,
    JoystickHatMotion,
    JoystickButtonDown,
    JoystickButtonUp,
    JoystickAdded,
    JoystickRemoved,
    JoystickBatteryUpdated,
    JoystickUpdateComplete,

    // Gamepad events
    GamepadAxisMotion = 0x650,
    GamepadButtonDown,
    GamepadButtonUp,
    GamepadAdded,
    GamepadRemoved,
    GamepadRemapped,
    GamepadTouchpadDown,
    GamepadTouchpadMotion,
    GamepadTouchpadUp,
    GamepadSensorUpdate,
    GamepadUpdateComplete,
    GamepadSteamHandleUpdated,

    // Touch events
    FingerDown = 0x700,
    FingerUp,
    FingerMotion,
    FingerCanceled,

    // Clipboard events
    ClipboardUpdate = 0x900,

    // Drag and drop events
    DropFile = 0x1000,
    DropText,
    DropBegin,
    DropComplete,
    DropPosition,

    // Audio hotplug events
    AudioDeviceAdded = 0x1100,
    AudioDeviceRemoved,
    AudioDeviceFormatChanged,

    // Sensor events
    SensorUpdate = 0x1200,

    // Pressure-sensitive pen events
    PenProximityIn = 0x1300,
    PenProximityOut,
    PenDown,
    PenUp,
    PenButtonDown,
    PenButtonUp,
    PenMotion,
    PenAxis,

    // Camera hotplug events
    CameraDeviceAdded = 0x1400,
    CameraDeviceRemoved,
    CameraDeviceApproved,
    CameraDeviceDenied,

    // Render events
    RenderTargetsReset = 0x2000,
    RenderDeviceReset,
    RenderDeviceLost,

    // Reserved events for private platforms
    Private0 = 0x4000,
    Private1,
    Private2,
    Private3,

    // Internal events
    PollSentinel = 0x7F00,

    // User events
    User = 0x8000,

    // Bounding value
    Last = 0xFFFF,
}

export interface CommonEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
}

export interface DisplayEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    displayID: number;
    data1: number;
    data2: number;
}

export interface WindowEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    windowID: WindowID;
    data1: number;
    data2: number;
}

export interface KeyboardDeviceEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    which: number;
}

export interface KeyboardEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    windowID: WindowID;
    which: number;
    scancode: Scancode;
    key: Keycode;
    mod: Keymod;
    raw: number;
    down: boolean;
    repeat: boolean;
}

export interface TextEditingEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    windowID: WindowID;
    text: string;
    start: number;
    length: number;
}

export interface TextEditingCandidatesEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    windowID: WindowID;
    candidates: string[] | null;
    num_candidates: number;
    selected_candidate: number;
    horizontal: boolean;
}

export interface TextInputEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    windowID: WindowID;
    text: string;
}

export interface MouseDeviceEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    which: number;
}

export interface MouseMotionEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    windowID: WindowID;
    which: number;
    state: number;
    x: number;
    y: number;
    xrel: number;
    yrel: number;
}

export interface MouseButtonEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    windowID: WindowID;
    which: number;
    button: number;
    down: boolean;
    clicks: number;
    x: number;
    y: number;
}

export interface MouseWheelEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    windowID: WindowID;
    which: number;
    x: number;
    y: number;
    direction: number;
    mouse_x: number;
    mouse_y: number;
    integer_x: number;
    integer_y: number;
}

export interface JoyAxisEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    which: number;
    axis: number;
    value: number;
}

export interface JoyBallEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    which: number;
    ball: number;
    xrel: number;
    yrel: number;
}

export interface JoyHatEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    which: number;
    hat: number;
    value: number;
}

export interface JoyButtonEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    which: number;
    button: number;
    down: boolean;
}

export interface JoyDeviceEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    which: number;
}

export interface JoyBatteryEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    which: number;
    state: number;
    percent: number;
}

export interface GamepadAxisEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    which: number;
    axis: number;
    value: number;
}

export interface GamepadButtonEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    which: number;
    button: number;
    down: boolean;
}

export interface GamepadDeviceEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    which: number;
}

export interface GamepadTouchpadEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    which: number;
    touchpad: number;
    finger: number;
    x: number;
    y: number;
    pressure: number;
}

export interface GamepadSensorEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    which: number;
    sensor: number;
    data: [number, number, number];
    sensor_timestamp: bigint;
}

export interface AudioDeviceEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    which: number;
    recording: boolean;
}

export interface CameraDeviceEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    which: number;
}

export interface RenderEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    windowID: WindowID;
}

export interface TouchFingerEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    touchID: bigint;
    fingerID: bigint;
    x: number;
    y: number;
    dx: number;
    dy: number;
    pressure: number;
    windowID: WindowID;
}

export interface PenProximityEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    windowID: WindowID;
    which: number;
}

export interface PenMotionEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    windowID: WindowID;
    which: number;
    pen_state: number;
    x: number;
    y: number;
}

export interface PenTouchEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    windowID: WindowID;
    which: number;
    pen_state: number;
    x: number;
    y: number;
    eraser: boolean;
    down: boolean;
}

export interface PenButtonEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    windowID: WindowID;
    which: number;
    pen_state: number;
    x: number;
    y: number;
    button: number;
    down: boolean;
}

export interface PenAxisEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    windowID: WindowID;
    which: number;
    pen_state: number;
    x: number;
    y: number;
    axis: number;
    value: number;
}

export interface DropEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    windowID: WindowID;
    x: number;
    y: number;
    source: string | null;
    data: string | null;
}

export interface ClipboardEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    owner: boolean;
    num_mime_types: number;
    mime_types: string[];
}

export interface SensorEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
    which: number;
    data: [number, number, number, number, number, number];
    sensor_timestamp: bigint;
}

export interface QuitEvent {
    type: EventType;
    reserved: number;
    timestamp: bigint;
}

export type SDLEvent =
    | { type: EventType.Quit; common: CommonEvent; quit: QuitEvent }
    | { type: EventType.KeyDown | EventType.KeyUp; common: CommonEvent; key: KeyboardEvent }
    | { type: EventType.KeyboardAdded | EventType.KeyboardRemoved; common: CommonEvent; kdevice: KeyboardDeviceEvent }
    | { type: EventType.TextEditing; common: CommonEvent; edit: TextEditingEvent }
    | { type: EventType.TextEditingCandidates; common: CommonEvent; edit_candidates: TextEditingCandidatesEvent }
    | { type: EventType.TextInput; common: CommonEvent; text: TextInputEvent }
    | { type: EventType.MouseMotion; common: CommonEvent; motion: MouseMotionEvent }
    | { type: EventType.MouseButtonDown | EventType.MouseButtonUp; common: CommonEvent; button: MouseButtonEvent }
    | { type: EventType.MouseWheel; common: CommonEvent; wheel: MouseWheelEvent }
    | { type: EventType.MouseAdded | EventType.MouseRemoved; common: CommonEvent; mdevice: MouseDeviceEvent }
    | { type: EventType.JoystickAxisMotion; common: CommonEvent; jaxis: JoyAxisEvent }
    | { type: EventType.JoystickBallMotion; common: CommonEvent; jball: JoyBallEvent }
    | { type: EventType.JoystickHatMotion; common: CommonEvent; jhat: JoyHatEvent }
    | { type: EventType.JoystickButtonDown | EventType.JoystickButtonUp; common: CommonEvent; jbutton: JoyButtonEvent }
    | {
    type: EventType.JoystickAdded | EventType.JoystickRemoved | EventType.JoystickUpdateComplete;
    common: CommonEvent;
    jdevice: JoyDeviceEvent
}
    | { type: EventType.JoystickBatteryUpdated; common: CommonEvent; jbattery: JoyBatteryEvent }
    | { type: EventType.GamepadAxisMotion; common: CommonEvent; gaxis: GamepadAxisEvent }
    | {
    type: EventType.GamepadButtonDown | EventType.GamepadButtonUp;
    common: CommonEvent;
    gbutton: GamepadButtonEvent
}
    | {
    type: EventType.GamepadAdded | EventType.GamepadRemoved | EventType.GamepadRemapped | EventType.GamepadUpdateComplete | EventType.GamepadSteamHandleUpdated;
    common: CommonEvent;
    gdevice: GamepadDeviceEvent
}
    | {
    type: EventType.GamepadTouchpadDown | EventType.GamepadTouchpadMotion | EventType.GamepadTouchpadUp;
    common: CommonEvent;
    gtouchpad: GamepadTouchpadEvent
}
    | { type: EventType.GamepadSensorUpdate; common: CommonEvent; gsensor: GamepadSensorEvent }
    | {
    type: EventType.AudioDeviceAdded | EventType.AudioDeviceRemoved | EventType.AudioDeviceFormatChanged;
    common: CommonEvent;
    adevice: AudioDeviceEvent
}
    | {
    type: EventType.CameraDeviceAdded | EventType.CameraDeviceRemoved | EventType.CameraDeviceApproved | EventType.CameraDeviceDenied;
    common: CommonEvent;
    cdevice: CameraDeviceEvent
}
    | {
    type: EventType.RenderTargetsReset | EventType.RenderDeviceReset | EventType.RenderDeviceLost;
    common: CommonEvent;
    render: RenderEvent
}
    | {
    type: EventType.FingerDown | EventType.FingerUp | EventType.FingerMotion | EventType.FingerCanceled;
    common: CommonEvent;
    tfinger: TouchFingerEvent
}
    | { type: EventType.PenProximityIn | EventType.PenProximityOut; common: CommonEvent; pproximity: PenProximityEvent }
    | { type: EventType.PenMotion; common: CommonEvent; pmotion: PenMotionEvent }
    | { type: EventType.PenDown | EventType.PenUp; common: CommonEvent; ptouch: PenTouchEvent }
    | { type: EventType.PenButtonDown | EventType.PenButtonUp; common: CommonEvent; pbutton: PenButtonEvent }
    | { type: EventType.PenAxis; common: CommonEvent; paxis: PenAxisEvent }
    | {
    type: EventType.DropFile | EventType.DropText | EventType.DropBegin | EventType.DropComplete | EventType.DropPosition;
    common: CommonEvent;
    drop: DropEvent
}
    | { type: EventType.ClipboardUpdate; common: CommonEvent; clipboard: ClipboardEvent }
    | { type: EventType.SensorUpdate; common: CommonEvent; sensor: SensorEvent }
    | {
    type: EventType.DisplayOrientation | EventType.DisplayAdded | EventType.DisplayRemoved | EventType.DisplayMoved | EventType.DisplayDesktopModeChanged | EventType.DisplayCurrentModeChanged | EventType.DisplayContentScaleChanged;
    common: CommonEvent;
    display: DisplayEvent
}
    | {
    type: EventType.WindowShown | EventType.WindowHidden | EventType.WindowExposed | EventType.WindowMoved | EventType.WindowResized | EventType.WindowPixelSizeChanged | EventType.WindowMetalViewResized | EventType.WindowMinimized | EventType.WindowMaximized | EventType.WindowRestored | EventType.WindowMouseEnter | EventType.WindowMouseLeave | EventType.WindowFocusGained | EventType.WindowFocusLost | EventType.WindowCloseRequested | EventType.WindowHitTest | EventType.WindowIccprofChanged | EventType.WindowDisplayChanged | EventType.WindowDisplayScaleChanged | EventType.WindowSafeAreaChanged | EventType.WindowOccluded | EventType.WindowEnterFullscreen | EventType.WindowLeaveFullscreen | EventType.WindowDestroyed | EventType.WindowHdrStateChanged;
    common: CommonEvent;
    window: WindowEvent
};
