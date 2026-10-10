import { useState } from "react";

export function NotImmediate() {
  const [count, setCount] = useState(0);

  function increment() {
    // `count` is a const from this render. setCount schedules the next render.
    // It does not assign a new value to this `count`.
    console.log("before", count);
    setCount(count + 1);
    console.log("after", count);
  }

  return (
    <section className="panel">
      <h2>State updates after render</h2>
      <p>Both console lines print the old count. The screen updates on the next render.</p>
      <p>Count: {count}</p>
      <button type="button" onClick={increment}>
        Increment
      </button>
      <p>
        <code>count</code> is the number from this render. <code>setCount</code> queues an update and returns immediately, so both logs still print that number. React renders again after the click handler finishes, and the screen shows the new count.
      </p>
    </section>
  );
}
