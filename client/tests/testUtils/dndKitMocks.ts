import { vi } from "vitest";

// These integration tests validate click-driven UI behavior, not drag-and-drop.
// Mocking dnd-kit avoids requiring JSDOM polyfills like ResizeObserver/PointerEvent/RAF.

type ChildrenProps = { children?: unknown };

vi.mock("@dnd-kit/core", () => {
    const Passthrough = ({ children }: ChildrenProps) => children ?? null;

    return {
        DndContext: Passthrough,
        DragOverlay: Passthrough,
        PointerSensor: class PointerSensor {},
        KeyboardSensor: class KeyboardSensor {},
        useSensor: () => ({}),
        useSensors: (...sensors: unknown[]) => sensors,
        closestCenter: () => [],
        pointerWithin: () => [],
        useDroppable: () => ({ setNodeRef: () => undefined, isOver: false }),
        useDraggable: () => ({
            attributes: {},
            listeners: {},
            setNodeRef: () => undefined,
            transform: null,
            isDragging: false,
        }),
    };
});

vi.mock("@dnd-kit/sortable", () => {
    const Passthrough = ({ children }: ChildrenProps) => children ?? null;

    return {
        SortableContext: Passthrough,
        rectSortingStrategy: {},
        verticalListSortingStrategy: {},
        useSortable: () => ({
            setNodeRef: () => undefined,
            setActivatorNodeRef: () => undefined,
            attributes: {},
            listeners: {},
            transform: null,
            transition: null,
            isDragging: false,
        }),
    };
});

vi.mock("@dnd-kit/utilities", () => ({
    CSS: {
        Transform: {
            toString: () => "",
        },
    },
}));

export {};