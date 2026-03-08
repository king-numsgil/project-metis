import type { PropertiesID } from "sdl3";
import {
    ttfAddFallbackFont,
    ttfClearFallbackFonts,
    ttfCloseFont,
    ttfCopyFont,
    ttfFontHasGlyph,
    ttfFontIsFixedWidth,
    ttfFontIsScalable,
    ttfGetFontAscent,
    ttfGetFontDescent,
    ttfGetFontDirection,
    ttfGetFontDPI,
    ttfGetFontFamilyName,
    ttfGetFontGeneration,
    ttfGetFontHeight,
    ttfGetFontHinting,
    ttfGetFontKerning,
    ttfGetFontLineSkip,
    ttfGetNumFontFaces,
    ttfGetFontOutline,
    ttfGetFontProperties,
    ttfGetFontScript,
    ttfGetFontSDF,
    ttfGetFontSize,
    ttfGetFontStyle,
    ttfGetFontStyleName,
    ttfGetFontWeight,
    ttfGetFontWrapAlignment,
    ttfGetGlyphKerning,
    ttfGetGlyphMetrics,
    ttfGetGlyphScript,
    ttfGetStringSize,
    ttfGetStringSizeWrapped,
    ttfMeasureString,
    ttfOpenFont,
    ttfOpenFontWithProperties,
    ttfRemoveFallbackFont,
    ttfSetFontDirection,
    ttfSetFontHinting,
    ttfSetFontKerning,
    ttfSetFontLanguage,
    ttfSetFontLineSkip,
    ttfSetFontOutline,
    ttfSetFontScript,
    ttfSetFontSDF,
    ttfSetFontSize,
    ttfSetFontSizeDPI,
    ttfSetFontStyle,
    ttfSetFontWrapAlignment,
} from "./ffi/index.ts";
import type {
    Direction,
    FontPtr,
    FontStyleFlags,
    GlyphMetrics,
    HintingFlags,
    HorizontalAlignment,
} from "./ffi/types/index.ts";

export class Font {
    private constructor(private readonly handle: FontPtr) {}

    public get raw(): FontPtr {
        return this.handle;
    }

    public static open(file: string, ptsize: number): Font {
        const handle = ttfOpenFont(file, ptsize);
        if (!handle) throw new Error(`TTF_OpenFont failed`);
        return new Font(handle);
    }

    public static openWithProperties(props: PropertiesID): Font {
        const handle = ttfOpenFontWithProperties(props);
        if (!handle) throw new Error(`TTF_OpenFontWithProperties failed`);
        return new Font(handle);
    }

    public copy(): Font {
        const handle = ttfCopyFont(this.handle);
        if (!handle) throw new Error(`TTF_CopyFont failed`);
        return new Font(handle);
    }

    public get properties(): PropertiesID {
        return ttfGetFontProperties(this.handle);
    }

    public get generation(): number {
        return ttfGetFontGeneration(this.handle);
    }

    public addFallback(fallback: Font): boolean {
        return ttfAddFallbackFont(this.handle, fallback.handle);
    }

    public removeFallback(fallback: Font): void {
        ttfRemoveFallbackFont(this.handle, fallback.handle);
    }

    public clearFallbacks(): void {
        ttfClearFallbackFonts(this.handle);
    }

    public get size(): number {
        return ttfGetFontSize(this.handle);
    }

    public set size(ptsize: number) {
        ttfSetFontSize(this.handle, ptsize);
    }

    public setSizeDPI(ptsize: number, hdpi: number, vdpi: number): boolean {
        return ttfSetFontSizeDPI(this.handle, ptsize, hdpi, vdpi);
    }

    public getDPI(): [number, number] | null {
        return ttfGetFontDPI(this.handle);
    }

    public get style(): FontStyleFlags {
        return ttfGetFontStyle(this.handle);
    }

    public set style(style: FontStyleFlags) {
        ttfSetFontStyle(this.handle, style);
    }

    public get outline(): number {
        return ttfGetFontOutline(this.handle);
    }

    public set outline(outline: number) {
        ttfSetFontOutline(this.handle, outline);
    }

    public get hinting(): HintingFlags {
        return ttfGetFontHinting(this.handle);
    }

    public set hinting(hinting: HintingFlags) {
        ttfSetFontHinting(this.handle, hinting);
    }

    public get sdf(): boolean {
        return ttfGetFontSDF(this.handle);
    }

    public set sdf(enabled: boolean) {
        ttfSetFontSDF(this.handle, enabled);
    }

    public get weight(): number {
        return ttfGetFontWeight(this.handle);
    }

    public get wrapAlignment(): HorizontalAlignment {
        return ttfGetFontWrapAlignment(this.handle);
    }

    public set wrapAlignment(align: HorizontalAlignment) {
        ttfSetFontWrapAlignment(this.handle, align);
    }

    public get height(): number {
        return ttfGetFontHeight(this.handle);
    }

    public get ascent(): number {
        return ttfGetFontAscent(this.handle);
    }

    public get descent(): number {
        return ttfGetFontDescent(this.handle);
    }

    public get lineSkip(): number {
        return ttfGetFontLineSkip(this.handle);
    }

    public set lineSkip(lineskip: number) {
        ttfSetFontLineSkip(this.handle, lineskip);
    }

    public get kerning(): boolean {
        return ttfGetFontKerning(this.handle);
    }

    public set kerning(enabled: boolean) {
        ttfSetFontKerning(this.handle, enabled);
    }

    public get numFaces(): number {
        return ttfGetNumFontFaces(this.handle);
    }

    public get isFixedWidth(): boolean {
        return ttfFontIsFixedWidth(this.handle);
    }

    public get isScalable(): boolean {
        return ttfFontIsScalable(this.handle);
    }

    public get familyName(): string {
        return ttfGetFontFamilyName(this.handle);
    }

    public get styleName(): string {
        return ttfGetFontStyleName(this.handle);
    }

    public get direction(): Direction {
        return ttfGetFontDirection(this.handle);
    }

    public set direction(direction: Direction) {
        ttfSetFontDirection(this.handle, direction);
    }

    public get script(): number {
        return ttfGetFontScript(this.handle);
    }

    public set script(script: number) {
        ttfSetFontScript(this.handle, script);
    }

    public set language(lang: string | null) {
        ttfSetFontLanguage(this.handle, lang);
    }

    public hasGlyph(ch: number): boolean {
        return ttfFontHasGlyph(this.handle, ch);
    }

    public getGlyphMetrics(ch: number): GlyphMetrics | null {
        return ttfGetGlyphMetrics(this.handle, ch);
    }

    public getGlyphKerning(previousCh: number, ch: number): number | null {
        return ttfGetGlyphKerning(this.handle, previousCh, ch);
    }

    public getStringSize(text: string): [number, number] | null {
        return ttfGetStringSize(this.handle, text);
    }

    public getStringSizeWrapped(text: string, wrapWidth: number): [number, number] | null {
        return ttfGetStringSizeWrapped(this.handle, text, wrapWidth);
    }

    public measureString(text: string, maxWidth: number): { width: number; length: number } | null {
        return ttfMeasureString(this.handle, text, maxWidth);
    }

    public [Symbol.dispose](): void {
        ttfCloseFont(this.handle);
    }
}
