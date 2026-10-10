import { useState } from "react";

export function StaleUpdate() {
  const [count, setCount] = useState(0);

  function addTwiceStale() {
    // `count` is the value from this render. Both calls compute the same next number.
    // React batches them, then keeps the last value, so the second call replaces the first.
    setCount(count + 1);
    setCount(count + 1);
  }

  function addTwiceFresh() {
    // Each updater receives the result of the previous one.
    // React runs them in order: 0 -> 1, then 1 -> 2.
    setCount((current) => current + 1);
    setCount((current) => current + 1);
  }

  return (
    <section className="panel">
      <h2>Functional update</h2>
      <p>Both buttons call setCount twice. Only the second one adds 2.</p>
      <p>Count: {count}</p>
      <div className="row">
        <button type="button" onClick={addTwiceStale}>
          +2 from this render
        </button>
        <button type="button" onClick={addTwiceFresh}>
          +2 from latest state
        </button>
      </div>
      <p>
        <strong>+2 from this render</strong> closes over <code>count</code> from this render. If the count is 0, both calls are <code>setCount(1)</code>. React applies the queue after the click handler finishes, and the later value replaces the earlier one, so the count becomes 1.
      </p>
      <p>
        <strong>+2 from latest state</strong> queues two functions. React calls the first with 0 and gets 1, then calls the second with that 1 and gets 2. Pass a function when the next state depends on the previous state.
      </p>
    </section>
  );
}
