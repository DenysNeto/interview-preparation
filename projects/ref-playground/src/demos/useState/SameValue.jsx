import { useRef, useState } from "react";

export function SameValue() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState({ name: "Ada" });
  const renders = useRef(0);
  renders.current += 1;

  return (
    <section className="panel">
      <h2>Same value bails out</h2>
      <p>Renders: {renders.current}</p>
      <p>Count: {count}</p>
      <div className="row">
        <button type="button" onClick={() => setCount(count)}>
          Set the same number
        </button>
        <button type="button" onClick={() => setCount(count + 1)}>
          Set the next number
        </button>
        <button type="button" onClick={() => setUser({ name: "Ada" })}>
          Set a new object
        </button>
      </div>
      <p>Name: {user.name}</p>
      <p>
        React compares the next state with <code>Object.is</code>. <strong>Set the same number</strong> passes the current <code>count</code>, so React skips the render and the counter stays put. <strong>Set the next number</strong> passes a different number, so React renders again.
      </p>
      <p>
        <strong>Set a new object</strong> builds a new <code>{"{ name: \"Ada\" }"}</code>. <code>Object.is</code> compares objects by reference, so this is a change even though the name is still Ada. The name on screen stays the same and the render count goes up.
      </p>
      <p>
        The render count starts at 2 and climbs by 2 because Strict Mode runs the component function twice in development, and <code>renders.current += 1</code> runs during that function.
      </p>
    </section>
  );
}
