"use client";

import confetti from "canvas-confetti";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Explosion from "react-canvas-confetti/dist/presets/explosion";
import { createPortal } from "react-dom";

type ExplosionType = "like" | "upvote" | "downvote";

interface ExplosionEvent {
  id: string;
  type: ExplosionType;
  x: number;
  y: number;
}

interface ExplosionContextType {
  triggerExplosion: (type: ExplosionType, element: HTMLElement) => void;
}

const ExplosionContext = createContext<ExplosionContextType | null>(null);

export const useExplosion = () => {
  const context = useContext(ExplosionContext);
  if (!context) {
    throw new Error("useExplosion must be used within ExplosionProvider");
  }
  return context;
};

export const ExplosionProvider = ({ children }: { children: React.ReactNode }) => {
  const [explosions, setExplosions] = useState<ExplosionEvent[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerExplosion = (type: ExplosionType, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const id = `${Date.now()}-${Math.random()}`;
    setExplosions((prev) => [...prev, { id, type, x, y }]);

    setTimeout(() => {
      setExplosions((prev) => prev.filter((e) => e.id !== id));
    }, 3000);
  };

  return (
    <ExplosionContext.Provider value={{ triggerExplosion }}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed inset-0 pointer-events-none z-[100]">
            {explosions.map((explosion) => (
              <ExplosionEffect key={explosion.id} type={explosion.type} x={explosion.x} y={explosion.y} />
            ))}
          </div>,
          document.body,
        )}
    </ExplosionContext.Provider>
  );
};

const ExplosionEffect = ({ type, x, y }: { type: ExplosionType; x: number; y: number }) => {
  const controllerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  const heartShape = useMemo(
    () => confetti.shapeFromPath("M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"),
    [],
  );

  const upArrowShape = useMemo(() => confetti.shapeFromPath("M12 2l-7 7h4v9h6v-9h4z"), []);

  const downArrowShape = useMemo(() => confetti.shapeFromPath("M12 22l7-7h-4V6H9v9H5z"), []);

  const onInitHandler = ({ conductor }: { conductor: any }) => {
    controllerRef.current = conductor;
    setIsReady(true);
  };

  useEffect(() => {
    if (isReady && controllerRef.current) {
      controllerRef.current.shoot();
    }
  }, [isReady]);

  const configs = {
    like: {
      colors: ["#ff4d6d", "#ff82a9", "#ffa1c0"],
      shapes: [heartShape],
      gravity: 0.1,
      angle: 90,
      spread: 360,
      startVelocity: 8,
    },
    upvote: {
      colors: ["#22c55e", "#4ade80", "#86efac"],
      shapes: [upArrowShape],
      gravity: -0.1,
      angle: 90,
      spread: 30,
      startVelocity: 8,
      drift: 0,
    },
    downvote: {
      colors: ["#ef4444", "#f87171", "#fca5a5"],
      shapes: [downArrowShape],
      gravity: 0.15,
      angle: 270,
      spread: 30,
      startVelocity: 8,
      drift: 0,
    },
  };

  const config = configs[type];

  return (
    <Explosion
      onInit={onInitHandler}
      style={{
        position: "fixed",
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -50%)",
      }}
      width={600}
      height={600}
      globalOptions={{ useWorker: true, disableForReducedMotion: true, resize: true }}
      decorateOptions={(defaultOptions) => ({
        ...defaultOptions,
        ...config,
        scalar: 1.2,
        particleCount: type === "like" ? 15 : 12,
        ticks: type === "like" ? 60 : 90,
        flat: true,
      })}
    />
  );
};
