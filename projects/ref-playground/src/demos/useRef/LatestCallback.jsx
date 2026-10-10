import { useEffect, useRef, useState } from "react";

export function LatestCallback() {
  const [label, setLabel] = useState("A");
  const onTickRef = useRef(null);

  function onTick() {
    console.log(`tick sees label=${label}`);
  }

  onTickRef.current = onTick;

  useEffect(() => {
    const id = setInterval(() => onTickRef.current(), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="panel">
      <h2>Latest callback</h2>
      <p>The interval starts once. Each tick calls the latest callback.</p>
      <div className="row">
        {["A", "B", "C"].map((next) => (
          <button
            key={next}
            type="button"
            aria-pressed={label === next}
            onClick={() => setLabel(next)}
          >
            {next}
          </button>
        ))}
      </div>
      <p>Label: {label}</p>
    </section>
  );
}
