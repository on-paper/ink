"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { VIDEO_DEBUG_CONFIG } from "../utils/videoDebug";

interface VideoDebugOverlayProps {
  enabled?: boolean;
}

export const VideoDebugOverlay = ({ enabled = VIDEO_DEBUG_CONFIG.autoplay }: VideoDebugOverlayProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !enabled) return null;

  const overlay = (
    <div className="fixed inset-0 pointer-events-none z-[100]" style={{ isolation: "isolate" }}>
      <div className="relative h-full w-full">
        {/* Upper half background */}
        <div className="absolute top-0 left-0 right-0 bg-green-500/5" style={{ height: "50%" }}>
          <div className="absolute top-4 left-4 text-green-600 text-xs font-mono bg-green-100/80 px-2 py-1 rounded">
            Autoplay Zone (Upper Half)
          </div>
        </div>

        {/* Lower half background */}
        <div className="absolute bottom-0 left-0 right-0 bg-gray-500/5" style={{ height: "50%" }} />

        {/* Center line */}
        <div
          className="absolute left-0 right-0 h-0.5 bg-blue-500 shadow-lg"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
          }}
        >
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-500/90 text-white px-2 py-1 rounded text-xs font-mono whitespace-nowrap">
            Center Line (Boundary)
          </div>
        </div>

        {/* Video count indicator */}
        <div className="fixed top-4 right-4 bg-black/80 text-white p-2 rounded-lg text-xs font-mono">
          <div id="video-debug-stats">Videos in upper half: 0</div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
};
