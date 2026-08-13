// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import { useDebouncedQuery } from "~/labs/core/shared/use-debounced-query";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

interface HarnessProps {
  onQueryChange: (query: string) => void;
  query: string;
}

function Harness({ onQueryChange, query }: HarnessProps) {
  const { queryDraft, setQueryDraft } = useDebouncedQuery({ onQueryChange, query });

  return (
    <>
      <output>{queryDraft}</output>
      <button onClick={() => setQueryDraft("checklist")} type="button">
        Search checklist
      </button>
      <button onClick={() => setQueryDraft("roadmap")} type="button">
        Search roadmap
      </button>
    </>
  );
}

describe("useDebouncedQuery", () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => root?.unmount());
    container?.remove();
    root = undefined as never;
    container = undefined as never;
    vi.useRealTimers();
  });

  async function render(props: HarnessProps) {
    container ??= document.createElement("div");
    root ??= createRoot(container);
    await act(async () => root.render(<Harness {...props} />));
  }

  test("does not emit immediately and cancels a superseded draft before emitting once", async () => {
    vi.useFakeTimers();
    const onQueryChange = vi.fn();
    await render({ onQueryChange, query: "" });

    await act(async () => {
      container.querySelector<HTMLButtonElement>("button")?.click();
    });
    await act(async () => vi.advanceTimersByTime(150));
    expect(onQueryChange).not.toHaveBeenCalled();

    await act(async () => {
      container.querySelectorAll<HTMLButtonElement>("button")[1]?.click();
    });
    await act(async () => vi.advanceTimersByTime(299));
    expect(onQueryChange).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTime(1));
    expect(onQueryChange).toHaveBeenCalledOnce();
    expect(onQueryChange).toHaveBeenCalledWith("roadmap");
  });

  test("restores an external URL query without echoing it to the URL owner", async () => {
    vi.useFakeTimers();
    const onQueryChange = vi.fn();
    await render({ onQueryChange, query: "checklist" });
    await render({ onQueryChange, query: "roadmap" });

    expect(container.querySelector("output")?.textContent).toBe("roadmap");
    await act(async () => vi.advanceTimersByTime(300));
    expect(onQueryChange).not.toHaveBeenCalled();
  });
});
