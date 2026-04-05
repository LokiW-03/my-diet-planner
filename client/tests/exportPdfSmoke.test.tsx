// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

vi.mock("@react-pdf/renderer", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@react-pdf/renderer")>();
    return {
        ...actual,
        pdf: vi.fn(),
    };
});

import { pdf } from "@react-pdf/renderer";

import { renderPlannerHarness } from "@/client/tests/testUtils/renderPlannerHarness";
import { resetPlannerStoreForTest } from "@/client/tests/testUtils/resetPlannerStoreForTest";

beforeEach(() => {
    resetPlannerStoreForTest();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("Export PDF (smoke)", () => {
    it("clicking Export calls pdf().toBlob() and triggers a download", async () => {
        const toBlobMock = vi.fn().mockResolvedValue(new Blob(["mock pdf"], { type: "application/pdf" }));
        const pdfMock = vi.mocked(pdf);

        type PdfFn = typeof pdf;
        type PdfInstance = ReturnType<PdfFn>;
        pdfMock.mockReturnValue({ toBlob: toBlobMock } as unknown as PdfInstance);

        type URLLike = typeof URL & {
            createObjectURL?: (obj: Blob) => string;
            revokeObjectURL?: (url: string) => void;
        };

        const urlStatic = URL as URLLike;
        const originalCreateObjectURL = urlStatic.createObjectURL;
        const originalRevokeObjectURL = urlStatic.revokeObjectURL;

        const createObjectURLMock = vi.fn<(obj: Blob) => string>().mockReturnValue("blob:mock");
        const revokeObjectURLMock = vi.fn<(url: string) => void>();

        // jsdom doesn't implement these; the app relies on them.
        urlStatic.createObjectURL = createObjectURLMock;
        urlStatic.revokeObjectURL = revokeObjectURLMock;

        const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => { });

        renderPlannerHarness();

        fireEvent.click(screen.getByRole("button", { name: "Export" }));

        await waitFor(() => expect(pdfMock).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(toBlobMock).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(createObjectURLMock).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(anchorClickSpy).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(revokeObjectURLMock).toHaveBeenCalledTimes(1));

        urlStatic.createObjectURL = originalCreateObjectURL;
        urlStatic.revokeObjectURL = originalRevokeObjectURL;
    });
});
