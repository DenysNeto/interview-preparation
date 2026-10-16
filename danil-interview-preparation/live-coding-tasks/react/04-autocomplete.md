# Accessible Autocomplete (Typeahead)

## Statement
Implement an autocomplete input in React + TypeScript:
- Suggestions appear as user types.
- User can navigate suggestions with keyboard:
  - `ArrowDown`
  - `ArrowUp`
  - `Enter`
  - `Escape`
- Active option is highlighted.
- Build with accessible listbox semantics.

## Requirements
- React 18+ hooks and TypeScript.
- Filter options by query (case-insensitive).
- Keyboard navigation and selection.
- Mouse click selection.
- A11y basics:
  - input with `role="combobox"`
  - list with `role="listbox"`
  - options with `role="option"`
  - `aria-activedescendant`
- Close list on Escape or when selecting.

## Time box
40-50 minutes

## What interviewers look for (Что ищут)
- Четкая модель состояния (`query`, `isOpen`, `activeIndex`).
- Корректная обработка клавиатуры и граничных условий.
- Доступность (roles/aria-атрибуты) на базовом уровне.
- Отсутствие хаоса в `onKeyDown` логике.
- Адекватный UX: подсветка активного пункта, закрытие списка.

## Hints
> - Храни `activeIndex` как `-1`, когда ничего не выбрано.
> - При изменении query можно открывать список и сбрасывать индекс.
> - Не забывай `preventDefault()` для стрелок/Enter в input.
> - `aria-activedescendant` должен ссылаться на `id` активной опции.

## Reference solution
```tsx
import React, { useMemo, useState } from "react";

const FRUITS = [
  "Apple",
  "Apricot",
  "Banana",
  "Blackberry",
  "Blueberry",
  "Cherry",
  "Mango",
  "Orange",
  "Peach",
  "Pineapple",
  "Strawberry",
];

export default function Autocomplete() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FRUITS;
    return FRUITS.filter((item) => item.toLowerCase().includes(q));
  }, [query]);

  const activeId =
    activeIndex >= 0 && activeIndex < filtered.length
      ? `option-${activeIndex}`
      : undefined;

  const selectItem = (value: string) => {
    setQuery(value);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setIsOpen(true);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        if (isOpen && activeIndex >= 0 && activeIndex < filtered.length) {
          e.preventDefault();
          selectItem(filtered[activeIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <section style={{ maxWidth: 460, margin: "32px auto", fontFamily: "sans-serif" }}>
      <h1>Autocomplete</h1>

      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="autocomplete-listbox"
        aria-activedescendant={activeId}
        aria-autocomplete="list"
        placeholder="Type a fruit..."
        style={{ width: "100%", padding: 8 }}
      />

      {isOpen && filtered.length > 0 && (
        <ul
          id="autocomplete-listbox"
          role="listbox"
          style={{
            listStyle: "none",
            padding: 0,
            margin: "8px 0 0",
            border: "1px solid #ddd",
            borderRadius: 6,
          }}
        >
          {filtered.map((item, idx) => {
            const isActive = idx === activeIndex;
            return (
              <li
                key={item}
                id={`option-${idx}`}
                role="option"
                aria-selected={isActive}
                onMouseDown={() => selectItem(item)}
                style={{
                  padding: "8px 10px",
                  background: isActive ? "#eef3ff" : "#fff",
                  cursor: "pointer",
                }}
              >
                {item}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
```

## Follow-up questions
- How would you support async server-side suggestions?
- Как сделать виртуализацию для 10k опций?
- What changes are needed for screen-reader announcements?
- Как закрывать список при клике вне компонента?
