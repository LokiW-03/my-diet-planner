import { defaultTargetId } from "@/shared/defaults";
import { usePlannerStore } from "@/client/src/hooks/useStore";

export function resetPlannerStoreForTest() {
  try {
    usePlannerStore.persist?.clearStorage?.();
  } catch {
    // ignore
  }

  type PlannerState = ReturnType<typeof usePlannerStore.getState>;
  type PlannerStoreWithInitial = typeof usePlannerStore & {
    getInitialState?: () => PlannerState;
  };

  const store = usePlannerStore as PlannerStoreWithInitial;
  const initial = store.getInitialState?.();

  // Preferred: reset the entire store state to its initial snapshot.
  // This prevents future state additions from leaking across tests.
  if (initial) {
    usePlannerStore.setState(initial, true);
    return;
  }

  usePlannerStore.setState({
    meals: {},
    hiddenMeals: {},
    mealPanelOrder: [],
    dayType: defaultTargetId("FULL"),
  });
}
