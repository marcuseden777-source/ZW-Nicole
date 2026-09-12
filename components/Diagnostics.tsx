"use client";

import { useEffect, useState } from "react";

import * as content from "@/content/wedding";

/**
 * What this particular device decided, and why.
 *
 * The three-dimensional layer is switched off by a capability check, and when
 * a guest reports "the seal isn't 3D" there is otherwise no way to find out
 * which of several reasons applied on their phone — the checks all happen in
 * their browser, on hardware nobody building this can hold.
 *
 * Add ?debug to the address to see the answer. It renders for nobody else:
 * no guest will ever meet it, it is stripped from print, and it reads nothing
 * and sends nothing anywhere.
 */
type Report = Record<string, string>;

export function Diagnostics() {
  const [report, setReport] = useState<Report | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("debug")) return;

    const out: Report = {};
    const nav = navigator as Navigator & { deviceMemory?: number };

    // The WebGL question, asked exactly the way the real check asks it.
    let gl: WebGL2RenderingContext | null = null;
    try {
      gl = document.createElement("canvas").getContext("webgl2");
    } catch (error) {
      out["webgl2 threw"] = String(error).slice(0, 80);
    }
    out["WebGL2 context"] = gl ? "yes" : "NO — this alone disables all 3D";

    let software = false;
    if (gl) {
      const debug = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = debug
        ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) ?? "")
        : "";
      software = /swiftshader|llvmpipe|software/i.test(renderer);
      out["GPU reported"] = debug ? renderer || "(blank)" : "hidden by the browser (normal on iOS)";
      out["looks like software"] = software ? "YES — 3D is refused on purpose" : "no";
      out["max texture size"] = String(gl.getParameter(gl.MAX_TEXTURE_SIZE));
      // Losing the context is what a throttled or memory-starved phone does.
      out["context lost already"] = gl.isContextLost() ? "YES" : "no";
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    out["Reduce Motion"] = reduced ? "ON — stops the moving 3D, not the seal" : "off";

    const cores = navigator.hardwareConcurrency ?? 0;
    const memory = nav.deviceMemory ?? 0;
    out["cores / memory"] = `${cores || "?"} / ${memory || "?"} GB`;
    out["treated as low power"] = cores <= 4 || (memory > 0 && memory <= 4) ? "yes" : "no";

    out["content.motion.webgl"] = String(content.motion.webgl);

    // Two different answers, because they are now two different questions.
    const canDraw = !!gl && !software && content.motion.webgl;
    out["→ wax seal in 3D"] = canDraw ? "YES" : "NO";
    out["→ moving 3D (door, world)"] = canDraw && !reduced ? "YES" : "NO";

    out["screen"] = `${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio}x`;
    out["standalone / in-app"] =
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
        ? "home-screen app"
        : /FBAN|FBAV|Instagram|Line|Twitter|WhatsApp|Snapchat/i.test(navigator.userAgent)
          ? "IN-APP BROWSER"
          : "normal browser";
    out["browser"] = navigator.userAgent.slice(0, 120);

    setReport(out);
  }, []);

  if (!report || hidden) return null;

  return (
    <div
      className="fixed inset-x-2 bottom-2 z-[200] max-h-[70vh] overflow-auto rounded-lg p-4 text-left"
      style={{
        background: "rgba(22,17,11,0.95)",
        color: "#f0e2c7",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "12px",
        lineHeight: 1.55,
      }}
      data-no-print
    >
      <button
        type="button"
        onClick={() => setHidden(true)}
        className="float-right ml-3 rounded border px-3 py-1"
        style={{ borderColor: "rgba(240,226,199,0.4)", color: "#f0e2c7" }}
      >
        close
      </button>
      <p style={{ fontWeight: 700, marginBottom: 8 }}>Why the 3D is on or off here</p>
      {Object.entries(report).map(([k, v]) => (
        <div key={k} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
          <span style={{ opacity: 0.62, minWidth: 150, flexShrink: 0 }}>{k}</span>
          <span
            style={{
              wordBreak: "break-word",
              color: /NO|ON —|YES —|IN-APP/.test(v) ? "#ffb4a2" : "#f0e2c7",
            }}
          >
            {v}
          </span>
        </div>
      ))}
    </div>
  );
}
