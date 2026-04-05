import { defaultTargetId } from "@/shared/defaults";
import { usePlannerStore } from "@/client/src/hooks/useStore";

export function resetPlannerStoreForTest() {
    try {
        usePlannerStore.persist?.clearStorage?.();
    } catch {
        // ignore
    }

    usePlannerStore.setState({
        meals: {},
        hiddenMeals: {},
        mealPanelOrder: [],
        dayType: defaultTargetId("FULL"),
    });
}
