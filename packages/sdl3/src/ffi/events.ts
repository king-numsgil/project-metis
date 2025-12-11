import { alloc, decode, free, sizeof } from "koffi";

import { EventType, type SDLEvent } from "sdl3";
import { sdl3 } from "./lib.ts";

export const sdlPumpEvents = sdl3.func("void SDL_PumpEvents()") as () => void;
export const sdlHasEvent = sdl3.func("bool SDL_HasEvent(uint32 type)") as (type: EventType) => boolean;
export const sdlHasEvents = sdl3.func("bool SDL_HasEvents(uint32 minType, uint32 maxType)") as (minType: EventType, maxType: EventType) => boolean;
export const sdlFlushEvent = sdl3.func("void SDL_FlushEvent(uint32 type)") as (type: EventType) => void;
export const sdlFlushEvents = sdl3.func("void SDL_FlushEvents(uint32 minType, uint32 maxType)") as (minType: EventType, maxType: EventType) => void;

const SDL_PollEvent = sdl3.func("bool SDL_PollEvent(_Out_ SDL_Event* event)");

export function sdlPollEvent(): SDLEvent | null {
    const eventOut = alloc("SDL_Event", sizeof("SDL_Event"));
    const hasEvent: boolean = SDL_PollEvent(eventOut);

    let event: SDLEvent | null = null;
    if (hasEvent) {
        event = decode(eventOut, "SDL_Event") as SDLEvent;
    }

    free(eventOut);
    return event;
}
