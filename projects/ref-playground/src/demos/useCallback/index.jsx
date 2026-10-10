import { useState } from "react";
import { EffectDependency } from "./EffectDependency.jsx";
import { MemoChild } from "./MemoChild.jsx";
import { StaleCallback } from "./StaleCallback.jsx";

const CASES = [
  ["memo", "Memo child", MemoChild],
  ["stale", "Stale callback", StaleCallback],
  ["effect", "Effect dependency", EffectDependency],
];

export function UseCallbackDemos() {
  const [current, setCurrent] = useState("memo");
  const Active = CASES.find(([id]) => id === current)[2];

  return (
    <>
      <p>
        <code>useCallback(fn, deps)</code> stores <code>fn</code> until a dependency changes. It is{" "}
        <code>useMemo(() =&gt; fn, deps)</code>. The component that calls it still renders.
      </p>
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
