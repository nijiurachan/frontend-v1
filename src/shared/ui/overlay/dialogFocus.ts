import { type RefObject, useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR: string = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.hasAttribute("hidden") &&
      element.getAttribute("aria-hidden") !== "true",
  );
}

export function getFocusTrapTarget(
  focusableElements: readonly HTMLElement[],
  activeElement: Element | null,
  shiftKey: boolean,
): HTMLElement | null {
  const first = focusableElements[0];
  const last = focusableElements.at(-1);
  if (!first || !last) return null;

  if (!focusableElements.includes(activeElement as HTMLElement)) {
    return shiftKey ? last : first;
  }
  if (shiftKey && activeElement === first) return last;
  if (!shiftKey && activeElement === last) return first;
  return null;
}

export function useDialogFocusTrap<T extends HTMLElement>(
  isOpen: boolean,
): RefObject<T | null> {
  const dialogRef = useRef<T>(null);

  useEffect(() => {
    if (!isOpen) return;
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const frame = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const initialFocus = getFocusableElements(dialog)[0] ?? dialog;
      initialFocus.focus();
    });

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const openDialogs = document.querySelectorAll<HTMLElement>(
        '[aria-modal="true"]',
      );
      if (openDialogs.item(openDialogs.length - 1) !== dialog) return;

      const focusableElements = getFocusableElements(dialog);
      const target = getFocusTrapTarget(
        focusableElements,
        document.activeElement,
        event.shiftKey,
      );
      if (target) {
        event.preventDefault();
        target.focus();
      } else if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return (): void => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      if (trigger?.isConnected) trigger.focus();
    };
  }, [isOpen]);

  return dialogRef;
}
