# Accessible Modal with Portal

## Statement
Create an accessible modal dialog in React + TypeScript.

Requirements include:
- render via `createPortal`
- close on `Escape`
- close on overlay click
- provide a basic focus trap sketch
- use `aria-modal` and proper dialog semantics
- restore focus to previously focused element when closed

## Requirements
- React 18+ hooks and TypeScript.
- Modal component receives `isOpen`, `onClose`, and content.
- Use portal target (e.g., `document.body`).
- On open: focus first focusable element in modal.
- On close: restore focus to trigger element.
- Basic focus trap with Tab / Shift+Tab.

## Time box
40-50 minutes

## What interviewers look for (Что ищут)
- Базовая доступность модального окна (`role="dialog"`, `aria-modal`).
- Чистая работа с глобальными событиями клавиатуры.
- Понимание focus management lifecycle.
- Умение аккуратно применять `createPortal`.
- Безопасный cleanup всех listener-ов.

## Hints
> - Сохрани `document.activeElement` перед открытием модалки.
> - После открытия сфокусируй элемент внутри окна (кнопка/инпут).
> - Для focus trap можно собрать список focusable-элементов и циклически переключать.
> - Обрабатывай `Escape` только когда модалка открыта.

## Reference solution
```tsx
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

function getFocusable(container: HTMLElement): HTMLElement[] {
  const selector = [
    "button:not([disabled])",
    "a[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveRef.current = document.activeElement as HTMLElement | null;

    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = getFocusable(dialog);
    focusable[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const nodes = getFocusable(dialog);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen && previousActiveRef.current) {
      previousActiveRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxWidth: "calc(100vw - 24px)",
          background: "#fff",
          borderRadius: 10,
          padding: 16,
        }}
      >
        <h2 id="modal-title">{title}</h2>
        <div>{children}</div>
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ModalDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <main style={{ margin: 24, fontFamily: "sans-serif" }}>
      <button onClick={() => setOpen(true)}>Open modal</button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Edit profile">
        <label style={{ display: "block", marginBottom: 8 }}>
          Name
          <input type="text" style={{ width: "100%", marginTop: 4 }} />
        </label>
        <button>Save</button>
      </Modal>
    </main>
  );
}
```

## Follow-up questions
- How would you lock body scroll while modal is open?
- Как обработать несколько вложенных модалок?
- What should change for screen-reader announcements?
- Как покрыть focus trap автотестами?
