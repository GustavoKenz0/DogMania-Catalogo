import { useCallback, useEffect, useState } from "react";
import { officeSize } from "./officeLayout";
import { OfficeTraffic, type TrafficPlan } from "./officeTraffic";

export type RegisterAvatar = (id: string, avatar: HTMLButtonElement | null) => void;

const percent = (coordinate: number) => (coordinate / officeSize) * 100 + "%";

function setFlag(avatar: HTMLElement, name: string, enabled: boolean) {
  if (enabled) {
    if (!avatar.hasAttribute(name)) avatar.setAttribute(name, "");
  } else if (avatar.hasAttribute(name)) {
    avatar.removeAttribute(name);
  }
}

export function useOfficeWalk(plans: TrafficPlan[], paused: boolean) {
  const [traffic] = useState(() => new OfficeTraffic());
  const [avatars] = useState(() => new Map<string, HTMLButtonElement>());

  const register = useCallback<RegisterAvatar>(
    (id, avatar) => {
      if (avatar) avatars.set(id, avatar);
      else avatars.delete(id);
    },
    [avatars],
  );

  const paint = useCallback(() => {
    for (const [id, avatar] of avatars) {
      const pet = traffic.get(id);
      if (!pet) continue;
      const [x, y] = pet.point;
      const left = percent(x);
      const top = percent(y);
      if (avatar.style.left !== left) avatar.style.left = left;
      if (avatar.style.top !== top) avatar.style.top = top;
      setFlag(avatar, "data-positioned", true);
      setFlag(avatar, "data-moving", pet.moving);
      setFlag(avatar, "data-arrived", pet.arrived);
      if (avatar.dataset.walkDirection !== pet.direction)
        avatar.dataset.walkDirection = pet.direction;
      const edge = x < 45 ? "left" : x > 266 ? "right" : "";
      if (avatar.dataset.edge !== edge) avatar.dataset.edge = edge;
    }
  }, [avatars, traffic]);

  useEffect(() => {
    traffic.sync(plans);
    paint();
  }, [traffic, plans, paint]);

  useEffect(() => {
    if (paused) {
      traffic.step(0, true);
      paint();
      return;
    }
    let frame = 0;
    let previous: number | undefined;
    let elapsed = 0;
    const frameStep = 1 / 60;
    const run = (time: number) => {
      if (previous !== undefined) elapsed += Math.min((time - previous) / 1000, 0.1);
      previous = time;
      while (elapsed >= frameStep) {
        traffic.step(frameStep);
        elapsed -= frameStep;
      }
      paint();
      frame = requestAnimationFrame(run);
    };
    frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }, [traffic, paused, paint]);

  return { register };
}
