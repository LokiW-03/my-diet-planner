"use client";

import { useEffect, type RefObject } from "react";

export function useDragScrollProxy({
  enabled,
  scrollAreaRef,
}: {
  enabled: boolean;
  scrollAreaRef: RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    if (!enabled) return;

    const onWheel = (ev: WheelEvent) => {
      if (ev.ctrlKey) return;

      const scrollEl = scrollAreaRef.current;
      if (!scrollEl) return;

      const rect = scrollEl.getBoundingClientRect();
      const x = ev.clientX;
      const y = ev.clientY;
      const isInside =
        x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      if (!isInside) return;

      const canScroll = scrollEl.scrollHeight > scrollEl.clientHeight;
      if (!canScroll) return;

      ev.preventDefault();
      ev.stopPropagation();
      scrollEl.scrollTop += ev.deltaY;
    };

    const options: AddEventListenerOptions = { capture: true, passive: false };
    window.addEventListener("wheel", onWheel, options);
    return () => window.removeEventListener("wheel", onWheel, options);
  }, [enabled, scrollAreaRef]);
}
