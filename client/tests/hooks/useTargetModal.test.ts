// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { Target, TargetId } from "@/shared/models";
import { defaultTargetId } from "@/shared/defaults";
import { useTargetModal } from "@/client/src/hooks/useTargetModal";

function target(id: TargetId, name: string): Target {
  return { id, name, minKcal: 0, maxKcal: 0 };
}

describe("useTargetModal", () => {
  it("does not change dayType when removing a non-current target", () => {
    const FULL = defaultTargetId("FULL");
    const HALF = defaultTargetId("HALF");

    const setDayType = vi.fn<(next: TargetId) => void>();
    const removeTarget = vi.fn<(id: TargetId) => void>();

    const { result } = renderHook(() =>
      useTargetModal({
        targetsById: {
          [FULL]: target(FULL, "FULL"),
          [HALF]: target(HALF, "HALF"),
        } as Record<TargetId, Target>,
        dayType: FULL,
        setDayType,
        addTarget: vi.fn(),
        updateTarget: vi.fn(),
        removeTarget,
        resetTargetsToDefault: vi.fn(),
        saveProfileAsDefault: vi.fn(async () => {}),
      }),
    );

    act(() => {
      result.current.actions.removeTargetAndFixDayType(HALF);
    });

    expect(setDayType).not.toHaveBeenCalled();
    expect(removeTarget).toHaveBeenCalledWith(HALF);
  });

  it("switches to FULL when removing current dayType and FULL exists", () => {
    const FULL = defaultTargetId("FULL");
    const HALF = defaultTargetId("HALF");

    const setDayType = vi.fn<(next: TargetId) => void>();
    const removeTarget = vi.fn<(id: TargetId) => void>();

    const { result } = renderHook(() =>
      useTargetModal({
        targetsById: {
          [FULL]: target(FULL, "FULL"),
          [HALF]: target(HALF, "HALF"),
        } as Record<TargetId, Target>,
        dayType: HALF,
        setDayType,
        addTarget: vi.fn(),
        updateTarget: vi.fn(),
        removeTarget,
        resetTargetsToDefault: vi.fn(),
        saveProfileAsDefault: vi.fn(async () => {}),
      }),
    );

    act(() => {
      result.current.actions.removeTargetAndFixDayType(HALF);
    });

    expect(setDayType).toHaveBeenCalledWith(FULL);
    expect(removeTarget).toHaveBeenCalledWith(HALF);
  });

  it("falls back to first remaining when removing current dayType and FULL is missing", () => {
    const FULL = defaultTargetId("FULL");
    const HALF = defaultTargetId("HALF");
    const REST = defaultTargetId("REST");

    const setDayType = vi.fn<(next: TargetId) => void>();
    const removeTarget = vi.fn<(id: TargetId) => void>();

    const { result } = renderHook(() =>
      useTargetModal({
        targetsById: {
          [FULL]: target(FULL, "FULL"),
          [HALF]: target(HALF, "HALF"),
          [REST]: target(REST, "REST"),
        } as Record<TargetId, Target>,
        dayType: FULL,
        setDayType,
        addTarget: vi.fn(),
        updateTarget: vi.fn(),
        removeTarget,
        resetTargetsToDefault: vi.fn(),
        saveProfileAsDefault: vi.fn(async () => {}),
      }),
    );

    act(() => {
      result.current.actions.removeTargetAndFixDayType(FULL);
    });

    expect(setDayType).toHaveBeenCalledWith(HALF);
    expect(removeTarget).toHaveBeenCalledWith(FULL);
  });

  it("resetTargetsToDefault resets targets and sets dayType to FULL", () => {
    const FULL = defaultTargetId("FULL");

    const resetTargetsToDefault = vi.fn<() => void>();
    const setDayType = vi.fn<(next: TargetId) => void>();

    const { result } = renderHook(() =>
      useTargetModal({
        targetsById: {
          [FULL]: target(FULL, "FULL"),
        } as Record<TargetId, Target>,
        dayType: FULL,
        setDayType,
        addTarget: vi.fn(),
        updateTarget: vi.fn(),
        removeTarget: vi.fn(),
        resetTargetsToDefault,
        saveProfileAsDefault: vi.fn(async () => {}),
      }),
    );

    act(() => {
      result.current.actions.resetTargetsToDefault();
    });

    expect(resetTargetsToDefault).toHaveBeenCalled();
    expect(setDayType).toHaveBeenCalledWith(FULL);
  });
});
