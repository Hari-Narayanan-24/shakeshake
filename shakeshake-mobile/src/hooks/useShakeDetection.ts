import { useEffect, useRef, useCallback } from "react";
import { Accelerometer } from "expo-sensors";

type UseShakeDetectionOptions = {
  onShake: () => void;
  threshold?: number;
  intervalMs?: number;
  cooldownMs?: number;
};

export function useShakeDetection({
  onShake,
  threshold = 1.5,
  intervalMs = 100,
  cooldownMs = 2000,
}: UseShakeDetectionOptions) {
  const lastShakeTime = useRef(0);
  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 });
  const subscription = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);
  const isActive = useRef(false);

  const startListening = useCallback(() => {
    if (isActive.current) return;
    isActive.current = true;

    Accelerometer.setUpdateInterval(intervalMs);
    subscription.current = Accelerometer.addListener(({ x, y, z }) => {
      const deltaX = x - lastAcceleration.current.x;
      const deltaY = y - lastAcceleration.current.y;
      const deltaZ = z - lastAcceleration.current.z;

      const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

      lastAcceleration.current = { x, y, z };

      const now = Date.now();
      if (magnitude > threshold && now - lastShakeTime.current > cooldownMs) {
        lastShakeTime.current = now;
        onShake();
      }
    });
  }, [onShake, threshold, intervalMs, cooldownMs]);

  const stopListening = useCallback(() => {
    if (subscription.current) {
      subscription.current.remove();
      subscription.current = null;
    }
    isActive.current = false;
  }, []);

  useEffect(() => {
    startListening();
    return () => stopListening();
  }, [startListening, stopListening]);

  return { isListening: isActive.current, startListening, stopListening };
}
