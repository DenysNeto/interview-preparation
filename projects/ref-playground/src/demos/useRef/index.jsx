import { useState } from "react";
import { AbortOnRef } from "./AbortOnRef.jsx";
import { DebounceTimer } from "./DebounceTimer.jsx";
import { LatestCallback } from "./LatestCallback.jsx";
import { PreviousValue } from "./PreviousValue.jsx";

const CASES = [
  ["latest", "Latest callback", LatestCallback],
  ["debounce", "Debounce timer", DebounceTimer],
  ["prev", "Previous value", PreviousValue],
  ["abort", "Abort controller", AbortOnRef],
];

export function UseRefDemos() {
  const [current, setCurrent] = useState("latest");
  const Active = CASES.find(([id]) => id === current)[2];

  return (
    <>
      <nav className="nav">
        {CASES.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={current === id} onClick={() => setCurrent(id)}>
            {label}
          </button>
        ))}
      </nav>
      <Active />
    </>
  );
}
