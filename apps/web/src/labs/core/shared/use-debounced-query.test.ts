import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

interface HookResult {
  queryDraft: string;
  setQueryDraft: (query: string) => void;
}

interface UseDebouncedQueryModule {
  useDebouncedQuery: (options: {
    onQueryChange: (query: string) => void;
    query: string;
    wait?: number;
  }) => HookResult;
}

type Effect = () => undefined | (() => void);

describe("useDebouncedQuery", () => {
  let effects: Effect[];
  let hook: UseDebouncedQueryModule;
  let refIndex: number;
  let refs: Array<{ current: string }>;
  let stateIndex: number;
  let states: string[];

  beforeEach(async () => {
    effects = [];
    refs = [];
    refIndex = 0;
    states = [];
    stateIndex = 0;
    vi.useFakeTimers();
    vi.resetModules();
    vi.doMock("react", () => ({
      useEffect(effect: Effect) {
        effects.push(effect);
      },
      useRef(initialValue: string) {
        const index = refIndex++;
        const ref = refs[index] ?? { current: initialValue };
        refs[index] = ref;
        return ref;
      },
      useState(initialValue: string) {
        const index = stateIndex++;
        states[index] ??= initialValue;
        return [states[index], (nextValue: string) => (states[index] = nextValue)];
      },
    }));
    hook = await import("./use-debounced-query");
  });

  afterEach(() => {
    vi.doUnmock("react");
    vi.useRealTimers();
  });

  function render(options: Parameters<UseDebouncedQueryModule["useDebouncedQuery"]>[0]) {
    stateIndex = 0;
    refIndex = 0;
    effects = [];
    const result = Harness(options);
    for (const effect of effects) {
      effect();
    }
    return result;
  }

  function Harness(options: Parameters<UseDebouncedQueryModule["useDebouncedQuery"]>[0]) {
    return hook.useDebouncedQuery(options);
  }

  test("updates the URL owner once after the draft settles", () => {
    const onQueryChange = vi.fn();
    const result = render({ onQueryChange, query: "" });

    result.setQueryDraft("checklist");
    render({ onQueryChange, query: "" });
    vi.advanceTimersByTime(299);
    expect(onQueryChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onQueryChange).toHaveBeenCalledOnce();
    expect(onQueryChange).toHaveBeenCalledWith("checklist");
  });

  test("restores the external URL query without another debounced update", () => {
    const onQueryChange = vi.fn();
    render({ onQueryChange, query: "checklist" });
    render({ onQueryChange, query: "roadmap" });
    render({ onQueryChange, query: "roadmap" });

    vi.advanceTimersByTime(300);
    expect(onQueryChange).not.toHaveBeenCalled();
  });
});
