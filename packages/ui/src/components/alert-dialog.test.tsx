// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe("AlertDialogContent", () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => root?.unmount());
    container?.remove();
    root = undefined as never;
    container = undefined as never;
  });

  test("provides a portaled overlay and content for the safe consumer composition", async () => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    let contentRef: HTMLDivElement | null = null;

    await act(async () => {
      root.render(
        <AlertDialog>
          <AlertDialogTrigger>Delete note</AlertDialogTrigger>
          <AlertDialogContent
            ref={(node) => {
              contentRef = node;
            }}
          >
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>,
      );
    });

    const trigger = container.querySelector<HTMLButtonElement>("button");
    expect(trigger).not.toBeNull();

    await act(async () => trigger?.click());

    const overlay = document.querySelector('[data-slot="alert-dialog-overlay"]');
    const content = document.querySelector<HTMLDivElement>('[data-slot="alert-dialog-content"]');

    expect(overlay).not.toBeNull();
    expect(content).not.toBeNull();
    expect(contentRef).toBe(content);
    expect(document.body.contains(content)).toBe(true);
    expect(container.contains(content)).toBe(false);
    expect(
      content
        ?.querySelector('[data-slot="alert-dialog-description"]')
        ?.classList.contains("[overflow-wrap:anywhere]"),
    ).toBe(true);
  });
});
