import { memo, useCallback, useRef, useState } from "react";

const MemoChildRow = memo(function MemoChildRow({ onPing }) {
  const renders = useRef(0);
  renders.current += 1;

  return (
    <p>
      Memo child renders: {renders.current}{" "}
      <button type="button" onClick={onPing}>
        Call callback
      </button>
    </p>
  );
});

export function MemoChild() {
  const [ticks, setTicks] = useState(0);
  const [stable, setStable] = useState(true);
  const parentRenders = useRef(0);
  parentRenders.current += 1;

  // One function for the life of this component. The child can skip while this stays the same.
  const stablePing = useCallback(() => {}, []);
  const onPing = stable ? stablePing : () => {};

  return (
    <section className="panel">
      <h2>Function identity</h2>
      <p>
        <code>memo</code> skips the child when every prop passes <code>Object.is</code> against the last render. A function prop is a new value whenever the parent creates it again.
      </p>
      <p>Parent renders: {parentRenders.current}</p>
      <p>Ticks: {ticks}</p>
      <div className="row">
        <button type="button" onClick={() => setTicks((current) => current + 1)}>
          Re-render parent
        </button>
        <button type="button" aria-pressed={stable} onClick={() => setStable(true)}>
          Stable callback
        </button>
        <button type="button" aria-pressed={!stable} onClick={() => setStable(false)}>
          Inline function
        </button>
      </div>
      <MemoChildRow onPing={onPing} />
      <p>
        <strong>Stable callback</strong> passes the function from <code>useCallback</code> with <code>[]</code>. Another parent render keeps that same function, so the memo child stays at the same render count. The parent count still goes up.
      </p>
      <p>
        <strong>Inline function</strong> creates a new function during render. <code>memo</code> sees a different <code>onPing</code> and renders the child again. Switching to this button also changes the function, so the child renders once for the switch.
      </p>
      <p>Both render counts start at 2 and climb by 2 because Strict Mode runs each component function twice in development.</p>
    </section>
  );
}
