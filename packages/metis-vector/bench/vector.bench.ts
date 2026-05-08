import { bench, group, run } from "mitata";
import { VectorContext } from "../index.js";

// ---------------------------------------------------------------------------
// Shared context — every bench leaves the queue empty via flush() or clear()
// ---------------------------------------------------------------------------

const ctx = new VectorContext(0.25);

const CANDIDATE_FONTS = [
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/calibri.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
];

let fontLoaded = false;
let fontPath = "";
for (const path of CANDIDATE_FONTS) {
    try {
        ctx.loadFont("bench", path);
        fontLoaded = true;
        fontPath = path;
        console.log(`[bench] Loaded font: ${path}\n`);
        break;
    } catch {
        // try next
    }
}
if (!fontLoaded) {
    console.warn("[bench] No system font found — text groups will be skipped\n");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function filledRect(x: number, y: number, w: number, h: number) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill(1, 1, 1, 1);
}

function filledTriangle() {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(100, 0);
    ctx.lineTo(50, 100);
    ctx.closePath();
    ctx.fill(1, 0, 0, 1);
}

// ---------------------------------------------------------------------------
// Path fill
// ---------------------------------------------------------------------------

group("path fill", () => {
    bench("triangle", () => {
        filledTriangle();
        ctx.flush();
    });

    bench("rectangle", () => {
        filledRect(0, 0, 200, 100);
        ctx.flush();
    });

    bench("circle via arc (r=50)", () => {
        ctx.beginPath();
        ctx.arc(50, 50, 50, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill(0, 0.5, 1, 1);
        ctx.flush();
    });

    bench("closed cubic-bezier shape", () => {
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.cubicTo(0, 0, 100, 0, 100, 50);
        ctx.cubicTo(100, 100, 0, 100, 0, 50);
        ctx.closePath();
        ctx.fill(0.8, 0.2, 0.4, 1);
        ctx.flush();
    });

    bench("100-vertex polygon", () => {
        const cx = 50, cy = 50, r = 50;
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
            const a = (i / 100) * Math.PI * 2;
            if (i === 0) ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
            else         ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
        }
        ctx.closePath();
        ctx.fill(0.5, 0.5, 0.5, 1);
        ctx.flush();
    });

    bench("quad-bezier fill", () => {
        ctx.beginPath();
        ctx.moveTo(0, 100);
        ctx.quadTo(50, 0, 100, 100);
        ctx.closePath();
        ctx.fill(0.3, 0.7, 0.3, 1);
        ctx.flush();
    });
});

// ---------------------------------------------------------------------------
// Path stroke
// ---------------------------------------------------------------------------

group("path stroke", () => {
    bench("triangle stroke w=2", () => {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(100, 0);
        ctx.lineTo(50, 100);
        ctx.closePath();
        ctx.stroke(0, 0, 0, 1, 2);
        ctx.flush();
    });

    bench("sine polyline 50 segs w=1", () => {
        ctx.beginPath();
        ctx.moveTo(0, 50);
        for (let i = 1; i <= 50; i++) {
            ctx.lineTo(i * 6, 50 + Math.sin(i * 0.4) * 30);
        }
        ctx.stroke(1, 0, 0, 1, 1);
        ctx.flush();
    });

    bench("circle outline w=4", () => {
        ctx.beginPath();
        ctx.arc(50, 50, 45, 0, Math.PI * 2);
        ctx.closePath();
        ctx.stroke(0, 1, 0, 1, 4);
        ctx.flush();
    });

    bench("cubic stroke w=2", () => {
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.cubicTo(25, 0, 75, 100, 100, 50);
        ctx.stroke(0, 0, 1, 1, 2);
        ctx.flush();
    });

    bench("thick stroke w=12", () => {
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(50, 0);
        ctx.lineTo(100, 50);
        ctx.lineTo(50, 100);
        ctx.closePath();
        ctx.stroke(1, 0.5, 0, 1, 12);
        ctx.flush();
    });
});

// ---------------------------------------------------------------------------
// Transforms
// ---------------------------------------------------------------------------

group("transforms", () => {
    bench("push + pop (no draw)", () => {
        ctx.pushTransform(new Float32Array([2, 0, 0, 2, 100, 100]));
        ctx.popTransform();
    });

    bench("push 8 + pop 8 (no draw)", () => {
        for (let i = 0; i < 8; i++) ctx.pushTransform(new Float32Array([1, 0, 0, 1, i * 10, 0]));
        for (let i = 0; i < 8; i++) ctx.popTransform();
    });

    bench("fill triangle under scale+translate", () => {
        ctx.pushTransform(new Float32Array([1.5, 0, 0, 1.5, 50, 50]));
        filledTriangle();
        ctx.popTransform();
        ctx.flush();
    });

    bench("setWorldTransform", () => {
        ctx.setWorldTransform(new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            10, 20, 0, 1,
        ]));
    });
});

// ---------------------------------------------------------------------------
// Paint — gradients (new in this build)
// ---------------------------------------------------------------------------

group("paint gradients", () => {
    bench("fill flat color", () => {
        ctx.beginPath();
        ctx.arc(50, 50, 50, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill(0, 0.5, 1, 1);
        ctx.flush();
    });

    bench("fillLinearGradient", () => {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(200, 0);
        ctx.lineTo(200, 100);
        ctx.lineTo(0, 100);
        ctx.closePath();
        ctx.fillLinearGradient(1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0);
        ctx.flush();
    });

    bench("fillRadialGradient", () => {
        ctx.beginPath();
        ctx.arc(50, 50, 50, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillRadialGradient(0, 0, 1, 1, 1, 0, 0, 1, 0.5, 0.5, 0.5);
        ctx.flush();
    });

    bench("strokeLinearGradient w=2", () => {
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(200, 50);
        ctx.strokeLinearGradient(1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 2);
        ctx.flush();
    });
});

if (fontLoaded) {
    // -----------------------------------------------------------------------
    // Text — warm cache (shared ctx, cache pre-warmed at loadFont time)
    // This is the steady-state cost per frame.
    // -----------------------------------------------------------------------
    group("text warm cache (drawText + fill + flush)", () => {
        bench("5 chars @ 16px", () => {
            ctx.drawText("Hello", "bench", 16, 0, 16);
            ctx.fill(0, 0, 0, 1);
            ctx.flush();
        });

        bench("43 chars @ 16px", () => {
            ctx.drawText("The quick brown fox jumps over the lazy dog", "bench", 16, 0, 16);
            ctx.fill(0, 0, 0, 1);
            ctx.flush();
        });

        bench("100 chars @ 16px", () => {
            ctx.drawText("ABCDEFGHIJ".repeat(10), "bench", 16, 0, 16);
            ctx.fill(0, 0, 0, 1);
            ctx.flush();
        });

        bench("50 digits @ 16px", () => {
            ctx.drawText("0123456789".repeat(5), "bench", 16, 0, 16);
            ctx.fill(0, 0, 0, 1);
            ctx.flush();
        });

        bench("mixed w/ accents @ 16px", () => {
            ctx.drawText("Hello, World! 123 — café résumé", "bench", 16, 0, 16);
            ctx.fill(0, 0, 0, 1);
            ctx.flush();
        });

        bench("5 chars @ 72px", () => {
            ctx.drawText("Hello", "bench", 72, 0, 72);
            ctx.fill(0, 0, 0, 1);
            ctx.flush();
        });

        bench("43 chars @ 72px", () => {
            ctx.drawText("The quick brown fox jumps over the lazy dog", "bench", 72, 0, 72);
            ctx.fill(0, 0, 0, 1);
            ctx.flush();
        });

        bench("cockpit readout '351 m/s' @ 16px", () => {
            ctx.drawText("351 m/s", "bench", 16, 0, 16);
            ctx.fill(1, 1, 1, 1);
            ctx.flush();
        });

        bench("cockpit readout '351 m/s' @ 24px", () => {
            ctx.drawText("351 m/s", "bench", 24, 0, 24);
            ctx.fill(1, 1, 1, 1);
            ctx.flush();
        });
    });

    // -----------------------------------------------------------------------
    // Text — glyph expansion only (no tessellation)
    // call clear() instead of flush() so Lyon never runs.
    // -----------------------------------------------------------------------
    group("text glyph expansion only (no tessellation)", () => {
        bench("5 chars", () => {
            ctx.drawText("Hello", "bench", 16, 0, 16);
            ctx.fill(0, 0, 0, 1);
            ctx.clear();
        });

        bench("43 chars", () => {
            ctx.drawText("The quick brown fox jumps over the lazy dog", "bench", 16, 0, 16);
            ctx.fill(0, 0, 0, 1);
            ctx.clear();
        });

        bench("100 chars", () => {
            ctx.drawText("ABCDEFGHIJ".repeat(10), "bench", 16, 0, 16);
            ctx.fill(0, 0, 0, 1);
            ctx.clear();
        });
    });

    // -----------------------------------------------------------------------
    // Font metrics — no draw, just parsing font tables
    // -----------------------------------------------------------------------
    group("font metrics", () => {
        bench("loadFont (pre-warm cost)", () => {
            const fresh = new VectorContext(0.25);
            fresh.loadFont("bench", fontPath);
        });

        bench("fontMetrics @ 16px", () => {
            ctx.fontMetrics("bench", 16);
        });

        bench("fontMetrics @ 72px", () => {
            ctx.fontMetrics("bench", 72);
        });

        bench("measureText 5 chars", () => {
            ctx.measureText("bench", 16, "Hello");
        });

        bench("measureText 43 chars", () => {
            ctx.measureText("bench", 16, "The quick brown fox jumps over the lazy dog");
        });

        bench("measureText 100 chars", () => {
            ctx.measureText("bench", 16, "ABCDEFGHIJ".repeat(10));
        });
    });
}

// ---------------------------------------------------------------------------
// Flush throughput — how cost scales with draw-call count
// ---------------------------------------------------------------------------

group("flush throughput", () => {
    bench("flush 1 rect", () => {
        filledRect(0, 0, 100, 100);
        ctx.flush();
    });

    bench("flush 10 rects", () => {
        for (let i = 0; i < 10; i++) filledRect((i % 5) * 25, Math.floor(i / 5) * 25, 20, 20);
        ctx.flush();
    });

    bench("flush 50 rects", () => {
        for (let i = 0; i < 50; i++) filledRect((i % 10) * 12, Math.floor(i / 10) * 12, 10, 10);
        ctx.flush();
    });

    bench("flush 50 mixed (rects + strokes)", () => {
        for (let i = 0; i < 25; i++) {
            filledRect((i % 5) * 22, Math.floor(i / 5) * 22, 18, 18);
            ctx.beginPath();
            ctx.moveTo(i * 4, 0);
            ctx.lineTo(i * 4 + 50, 100);
            ctx.stroke(0, 0, 0, 1, 1);
        }
        ctx.flush();
    });

    bench("clear 50 queued rects (no tessellation)", () => {
        for (let i = 0; i < 50; i++) filledRect((i % 10) * 12, Math.floor(i / 10) * 12, 10, 10);
        ctx.clear();
    });
});

// ---------------------------------------------------------------------------
// Mixed scene — representative real-world frame
// ---------------------------------------------------------------------------

group("mixed scene", () => {
    if (fontLoaded) {
        bench("10 shapes + 3 text labels", () => {
            filledRect(0, 0, 400, 300);

            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.arc(50 + i * 80, 150, 30, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill(i * 0.2, 0.5, 1 - i * 0.2, 1);
            }

            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.moveTo(i * 80, 0);
                ctx.lineTo(i * 80, 300);
                ctx.stroke(0.3, 0.3, 0.3, 0.5, 1);
            }

            ctx.drawText("Title",   "bench", 24, 10, 30); ctx.fill(0, 0, 0, 1);
            ctx.drawText("Label A", "bench", 14, 10, 60); ctx.fill(0.2, 0.2, 0.2, 1);
            ctx.drawText("Label B", "bench", 14, 10, 80); ctx.fill(0.2, 0.2, 0.2, 1);

            ctx.flush();
        });

        bench("HUD scene: 5 readouts + 3 shapes", () => {
            // Simulate a cockpit HUD: speed, heading, altitude, fuel, target distance
            const readouts = ["351 m/s", "HDG 042°", "ALT 1,240m", "FUEL 87%", "4.2 km"];
            for (let i = 0; i < readouts.length; i++) {
                ctx.drawText(readouts[i]!, "bench", 16, 10, 20 + i * 22);
                ctx.fill(1, 1, 1, 1);
            }

            // Three UI shapes
            ctx.beginPath();
            ctx.arc(200, 100, 40, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill(0, 0.5, 1, 0.8);

            ctx.beginPath();
            ctx.moveTo(160, 160);
            ctx.lineTo(240, 160);
            ctx.stroke(1, 1, 1, 0.5, 1);

            filledRect(150, 170, 100, 4);

            ctx.flush();
        });
    }

    bench("10 shapes only (no text)", () => {
        filledRect(0, 0, 400, 300);
        for (let i = 0; i < 9; i++) {
            ctx.beginPath();
            ctx.arc(50 + i * 40, 150, 20, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill(i * 0.1, 0.5, 1, 1);
        }
        ctx.flush();
    });
});

// ---------------------------------------------------------------------------

await run();
