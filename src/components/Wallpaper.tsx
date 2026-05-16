import React from "react";
import type { Wallpaper as WallpaperKind } from "../types";

interface WallpaperDef {
  label: string;
  bg: string;
  blobs: { x: string; y: string; r: number; c: string }[];
}

export const WALLPAPERS: Record<WallpaperKind, WallpaperDef> = {
  dusk: {
    label: "Dusk",
    bg: "linear-gradient(155deg, #ff9bb6 0%, #a78bfa 35%, #4f46e5 70%, #1e1b4b 100%)",
    blobs: [
      { x: "10%",  y: "15%", r: 360, c: "rgba(255,200,220,0.55)" },
      { x: "85%",  y: "20%", r: 320, c: "rgba(160,130,255,0.55)" },
      { x: "70%",  y: "85%", r: 380, c: "rgba(255,150,180,0.50)" },
      { x: "15%",  y: "80%", r: 300, c: "rgba(120,180,255,0.55)" },
    ],
  },
  forest: {
    label: "Forest",
    bg: "linear-gradient(170deg, #84cc16 0%, #14b8a6 40%, #047857 75%, #064e3b 100%)",
    blobs: [
      { x: "20%", y: "25%", r: 340, c: "rgba(180,230,130,0.50)" },
      { x: "80%", y: "30%", r: 300, c: "rgba(80,200,180,0.50)" },
      { x: "60%", y: "85%", r: 360, c: "rgba(40,160,120,0.55)" },
      { x: "10%", y: "75%", r: 280, c: "rgba(160,220,160,0.45)" },
    ],
  },
  copper: {
    label: "Copper",
    bg: "linear-gradient(160deg, #fed7aa 0%, #fb923c 35%, #c2410c 70%, #431407 100%)",
    blobs: [
      { x: "15%", y: "20%", r: 340, c: "rgba(255,220,170,0.55)" },
      { x: "78%", y: "25%", r: 300, c: "rgba(255,150,100,0.50)" },
      { x: "72%", y: "78%", r: 360, c: "rgba(220,90,50,0.50)" },
      { x: "18%", y: "82%", r: 280, c: "rgba(255,180,120,0.45)" },
    ],
  },
  graphite: {
    label: "Graphite",
    bg: "linear-gradient(165deg, #94a3b8 0%, #475569 40%, #1e293b 75%, #0f172a 100%)",
    blobs: [
      { x: "15%", y: "20%", r: 340, c: "rgba(200,220,255,0.35)" },
      { x: "80%", y: "25%", r: 320, c: "rgba(120,140,200,0.40)" },
      { x: "65%", y: "80%", r: 360, c: "rgba(80,120,180,0.40)" },
      { x: "20%", y: "85%", r: 300, c: "rgba(180,200,220,0.30)" },
    ],
  },
};

export const Wallpaper: React.FC<{ kind: WallpaperKind }> = ({ kind }) => {
  const wp = WALLPAPERS[kind] ?? WALLPAPERS.dusk;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: wp.bg, zIndex: 0 }}>
      {wp.blobs.map((b, i) => (
        <div key={i} style={{
          position: "absolute",
          left: b.x, top: b.y, width: b.r, height: b.r,
          marginLeft: -b.r / 2, marginTop: -b.r / 2,
          borderRadius: "50%", background: b.c, filter: "blur(70px)",
        }} />
      ))}
      <div style={{
        position: "absolute", inset: 0,
        background: "repeating-linear-gradient(45deg,transparent 0,transparent 2px,rgba(255,255,255,0.012) 2px,rgba(255,255,255,0.012) 3px)",
      }} />
    </div>
  );
};
