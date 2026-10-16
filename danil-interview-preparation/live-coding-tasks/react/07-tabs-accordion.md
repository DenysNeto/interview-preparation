# Tabs with Compound Components and Keyboard Support

## Statement
Build a Tabs component system in React + TypeScript using a compound components pattern.

Features:
- `Tabs`, `Tabs.List`, `Tabs.Trigger`, `Tabs.Panel`
- Manage selected tab in parent context
- Keyboard support:
  - ArrowRight / ArrowLeft to move focus & selection
  - Home / End optional bonus
- Basic accessibility attributes (`role=tablist/tab/tabpanel`)

## Requirements
- React 18+ hooks and TypeScript.
- Use Context for compound components communication.
- `Tabs` accepts default active tab value.
- Triggers and panels linked by a shared tab `value`.
- Keyboard support for triggers.
- Highlight active trigger and show only active panel.

## Time box
45-55 minutes

## What interviewers look for (Что ищут)
- Понимание compound components и контекста.
- Чистый API компонента (читабельно в JSX).
- Доступность табов (`aria-selected`, `aria-controls`, `aria-labelledby`).
- Корректная клавиатурная навигация.
- Поддерживаемая архитектура без overengineering.

## Hints
> - Храни `activeValue` и `setActiveValue` в контексте.
> - Для стрелок удобно хранить массив значений триггеров.
> - Свяжи tab и panel через id (`tab-${value}`, `panel-${value}`).
> - Если контекст отсутствует, бросай ошибку (guard hook).

## Reference solution
```tsx
import React, { createContext, useContext, useMemo, useState } from "react";

type TabsContextType = {
  activeValue: string;
  setActiveValue: (value: string) => void;
  values: string[];
};

const TabsContext = createContext<TabsContextType | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error("Tabs compound components must be used inside <Tabs.Root>.");
  }
  return ctx;
}

type TabsRootProps = {
  defaultValue: string;
  values: string[];
  children: React.ReactNode;
};

function Root({ defaultValue, values, children }: TabsRootProps) {
  const [activeValue, setActiveValue] = useState(defaultValue);
  const contextValue = useMemo(
    () => ({ activeValue, setActiveValue, values }),
    [activeValue, values]
  );

  return <TabsContext.Provider value={contextValue}>{children}</TabsContext.Provider>;
}

function List({ children }: { children: React.ReactNode }) {
  return (
    <div role="tablist" aria-label="Sample tabs" style={{ display: "flex", gap: 8 }}>
      {children}
    </div>
  );
}

type TriggerProps = {
  value: string;
  children: React.ReactNode;
};

function Trigger({ value, children }: TriggerProps) {
  const { activeValue, setActiveValue, values } = useTabsContext();
  const selected = activeValue === value;
  const idx = values.indexOf(value);

  const onKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (idx < 0) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActiveValue(values[(idx + 1) % values.length]);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActiveValue(values[(idx - 1 + values.length) % values.length]);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveValue(values[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveValue(values[values.length - 1]);
    }
  };

  return (
    <button
      id={`tab-${value}`}
      role="tab"
      aria-selected={selected}
      aria-controls={`panel-${value}`}
      tabIndex={selected ? 0 : -1}
      onClick={() => setActiveValue(value)}
      onKeyDown={onKeyDown}
      style={{
        padding: "8px 12px",
        border: "1px solid #ddd",
        background: selected ? "#eef3ff" : "#fff",
      }}
    >
      {children}
    </button>
  );
}

type PanelProps = {
  value: string;
  children: React.ReactNode;
};

function Panel({ value, children }: PanelProps) {
  const { activeValue } = useTabsContext();
  if (activeValue !== value) return null;

  return (
    <div
      id={`panel-${value}`}
      role="tabpanel"
      aria-labelledby={`tab-${value}`}
      style={{ marginTop: 12, padding: 12, border: "1px solid #eee" }}
    >
      {children}
    </div>
  );
}

export const Tabs = {
  Root,
  List,
  Trigger,
  Panel,
};

export default function TabsDemo() {
  return (
    <main style={{ maxWidth: 640, margin: "24px auto", fontFamily: "sans-serif" }}>
      <h1>Compound Tabs</h1>
      <Tabs.Root defaultValue="account" values={["account", "security", "billing"]}>
        <Tabs.List>
          <Tabs.Trigger value="account">Account</Tabs.Trigger>
          <Tabs.Trigger value="security">Security</Tabs.Trigger>
          <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Panel value="account">Account settings content</Tabs.Panel>
        <Tabs.Panel value="security">Security settings content</Tabs.Panel>
        <Tabs.Panel value="billing">Billing settings content</Tabs.Panel>
      </Tabs.Root>
    </main>
  );
}
```

## Follow-up questions
- How would you support controlled + uncontrolled modes?
- Как сделать lazy-mount панелей?
- What API changes would you make for vertical tabs?
- Как протестировать keyboard navigation?
