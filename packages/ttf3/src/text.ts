import {
    ttfAppendTextString,
    ttfCreateText,
    ttfDecodeText,
    ttfDeleteTextString,
    ttfDestroyText,
    ttfGetNextTextSubString,
    ttfGetPreviousTextSubString,
    ttfGetTextColor,
    ttfGetTextColorFloat,
    ttfGetTextDirection,
    ttfGetTextEngine,
    ttfGetTextFont,
    ttfGetTextPosition,
    ttfGetTextScript,
    ttfGetTextSize,
    ttfGetTextSubString,
    ttfGetTextSubStringForLine,
    ttfGetTextSubStringForPoint,
    ttfGetTextWrapWidth,
    ttfInsertTextString,
    ttfSetTextColor,
    ttfSetTextColorFloat,
    ttfSetTextDirection,
    ttfSetTextEngine,
    ttfSetTextFont,
    ttfSetTextPosition,
    ttfSetTextScript,
    ttfSetTextString,
    ttfSetTextWrapWhitespaceVisible,
    ttfSetTextWrapWidth,
    ttfTextWrapWhitespaceVisible,
    ttfUpdateText,
} from "./ffi/index.ts";
import type { Direction, FontPtr, TextEnginePtr, TextPtr, TTFSubString } from "./ffi/types/index.ts";

export class Text {
    private constructor(private readonly handle: TextPtr) {
    }

    public get raw(): TextPtr {
        return this.handle;
    }

    /** The current UTF-8 string content of this text object. */
    public get text(): string {
        return ttfDecodeText(this.handle).text;
    }

    /** The number of lines in the text. */
    public get numLines(): number {
        return ttfDecodeText(this.handle).num_lines;
    }

    public get engine(): TextEnginePtr | null {
        return ttfGetTextEngine(this.handle);
    }

    public set engine(engine: TextEnginePtr) {
        ttfSetTextEngine(this.handle, engine);
    }

    public get font(): FontPtr | null {
        return ttfGetTextFont(this.handle);
    }

    public set font(font: FontPtr | null) {
        ttfSetTextFont(this.handle, font);
    }

    public get direction(): Direction {
        return ttfGetTextDirection(this.handle);
    }

    public set direction(direction: Direction) {
        ttfSetTextDirection(this.handle, direction);
    }

    public get script(): number {
        return ttfGetTextScript(this.handle);
    }

    public set script(script: number) {
        ttfSetTextScript(this.handle, script);
    }

    public get color(): [number, number, number, number] | null {
        return ttfGetTextColor(this.handle);
    }

    public set color([r, g, b, a]: [number, number, number, number]) {
        ttfSetTextColor(this.handle, r, g, b, a);
    }

    public get colorFloat(): [number, number, number, number] | null {
        return ttfGetTextColorFloat(this.handle);
    }

    public set colorFloat([r, g, b, a]: [number, number, number, number]) {
        ttfSetTextColorFloat(this.handle, r, g, b, a);
    }

    public get position(): [number, number] | null {
        return ttfGetTextPosition(this.handle);
    }

    public set position([x, y]: [number, number]) {
        ttfSetTextPosition(this.handle, x, y);
    }

    public get wrapWidth(): number | null {
        return ttfGetTextWrapWidth(this.handle);
    }

    public set wrapWidth(width: number) {
        ttfSetTextWrapWidth(this.handle, width);
    }

    public get wrapWhitespaceVisible(): boolean {
        return ttfTextWrapWhitespaceVisible(this.handle);
    }

    public set wrapWhitespaceVisible(visible: boolean) {
        ttfSetTextWrapWhitespaceVisible(this.handle, visible);
    }

    public set string(value: string | null) {
        ttfSetTextString(this.handle, value, 0);
    }

    public static create(engine: TextEnginePtr | null, font: { raw: FontPtr }, text: string): Text {
        const handle = ttfCreateText(engine, font.raw, text, 0);

        if (!handle) {
            throw new Error(`TTF_CreateText failed`);
        }
        return new Text(handle);
    }

    public append(str: string): boolean {
        return ttfAppendTextString(this.handle, str, 0);
    }

    public insert(offset: number, str: string): boolean {
        return ttfInsertTextString(this.handle, offset, str, 0);
    }

    public delete(offset: number, length: number): boolean {
        return ttfDeleteTextString(this.handle, offset, length);
    }

    public getSize(): [number, number] | null {
        return ttfGetTextSize(this.handle);
    }

    public update(): boolean {
        return ttfUpdateText(this.handle);
    }

    public getSubString(offset: number): TTFSubString | null {
        return ttfGetTextSubString(this.handle, offset);
    }

    public getSubStringForLine(line: number): TTFSubString | null {
        return ttfGetTextSubStringForLine(this.handle, line);
    }

    public getSubStringForPoint(x: number, y: number): TTFSubString | null {
        return ttfGetTextSubStringForPoint(this.handle, x, y);
    }

    public getPreviousSubString(substring: TTFSubString): TTFSubString | null {
        return ttfGetPreviousTextSubString(this.handle, substring);
    }

    public getNextSubString(substring: TTFSubString): TTFSubString | null {
        return ttfGetNextTextSubString(this.handle, substring);
    }

    public [Symbol.dispose](): void {
        ttfDestroyText(this.handle);
    }
}
