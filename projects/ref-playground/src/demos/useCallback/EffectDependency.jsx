import { useCallback, useEffect, useRef, useState } from "react";

function Watcher({ onEffect }) {
  const [runs, setRuns] = useState(0);
  const [seen, setSeen] = useState(null);

  useEffect(() => {
    setRuns((current) => current + 1);
    setSeen(onEffect());
  }, [onEffect]);

  return (
    <>
      <p>Effect runs: {runs}</p>
      <p>Callback saw count: {seen ?? "—"}</p>
    </>
  );
}

const MODES = [
  ["inline", "Inline function"],
  ["empty", "Empty deps"],
  ["count", "Deps [count]"],
];

export function EffectDependency() {
  const [ticks, setTicks] = useState(0);
  const [count, setCount] = useState(0);
  const [mode, setMode] = useState("inline");
  const parentRenders = useRef(0);
  parentRenders.current += 1;

  const empty = useCallback(() => count, []);
  const withCount = useCallback(() => count, [count]);
  const inline = () => count;
  const onEffect = mode === "empty" ? empty : mode === "count" ? withCount : inline;

  return (
    <section className="panel">
      <h2>Effect dependency</h2>
      <p>The effect lists the callback as a dependency. React restarts the effect when that function fails <code>Object.is</code>.</p>
      <p>Parent renders: {parentRenders.current}</p>
      <p>
        Ticks: {ticks}. Count: {count}
      </p>
      <div className="row">
        <button type="button" onClick={() => setTicks((current) => current + 1)}>
          Re-render parent
        </button>
        <button type="button" onClick={() => setCount((current) => current + 1)}>
          Increment count
        </button>
        {MODES.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)}>
            {label}
          </button>
        ))}
      </div>
      <Watcher onEffect={onEffect} />
      <p>
        <strong>Inline function</strong> is a new function on every parent render, so each tick restarts the effect. The restart sees the current count.
      </p>
      <p>
        <strong>Empty deps</strong> keeps the function from the first render. Later ticks and count changes leave the effect in place. The stored function still returns the first count, 0.
      </p>
      <p>
        <strong>Deps [count]</strong> returns a new function when <code>count</code> changes. A tick leaves the effect alone. Incrementing count restarts it, and the new function returns that count.
      </p>
      <p>
        The effect run count starts at 2 because Strict Mode starts the effect, cleans it up, and starts it again on mount. Later restarts add 1. The parent render count still climbs by 2.
      </p>
    </section>
  );
}
