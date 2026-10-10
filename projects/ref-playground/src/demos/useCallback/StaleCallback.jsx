import { useCallback, useRef, useState } from "react";
import { stamp } from "../../log.js";

function generationOf(slot, fn) {
  if (slot.fn !== fn) {
    slot.generation += 1;
    slot.fn = fn;
  }
  return slot.generation;
}

export function StaleCallback() {
  const [count, setCount] = useState(0);
  const [lines, setLines] = useState([]);
  const emptySlot = useRef({ fn: null, generation: 0 });
  const freshSlot = useRef({ fn: null, generation: 0 });

  // The stored function keeps reading `count` from the render that created it.
  const emptyDeps = useCallback(() => count, []);
  const withCount = useCallback(() => count, [count]);
  const emptyGeneration = generationOf(emptySlot.current, emptyDeps);
  const freshGeneration = generationOf(freshSlot.current, withCount);

  function remember(line) {
    setLines((existing) => [...existing.slice(-8), line]);
  }

  return (
    <section className="panel">
      <h2>Stale callback</h2>
      <p>
        <code>useCallback</code> compares the dependency list. It does not look at the variables the function reads.
      </p>
      <p>Count: {count}</p>
      <p>Empty deps function: generation {emptyGeneration}</p>
      <p>Deps [count] function: generation {freshGeneration}</p>
      <div className="row">
        <button type="button" onClick={() => setCount((current) => current + 1)}>
          Increment
        </button>
        <button type="button" onClick={() => remember(stamp("callback", `empty deps sees ${emptyDeps()}`))}>
          Call empty deps
        </button>
        <button type="button" onClick={() => remember(stamp("callback", `[count] sees ${withCount()}`))}>
          Call deps [count]
        </button>
      </div>
      <pre className="log">{lines.join("\n")}</pre>
      <p>
        <strong>Call empty deps</strong> runs the function stored on the first render. After increment, that function still returns 0, and its generation stays 1 because <code>[]</code> never changes.
      </p>
      <p>
        <strong>Call deps [count]</strong> runs a function stored for the current count. Increment replaces that function, the generation goes up, and the call returns the new count.
      </p>
    </section>
  );
}
