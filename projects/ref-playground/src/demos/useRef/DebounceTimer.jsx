import { useEffect, useRef, useState } from "react";

export function DebounceTimer() {
  const [value, setValue] = useState("");
  const [query, setQuery] = useState("");
  const timer = useRef(null);

  useEffect(() => {
    console.log("value changed", value);

    timer.current && clearTimeout(timer.current);

    timer.current = setTimeout(() => {
      setQuery(value);
      console.log("query changed", query);
    }, 1000);
  }, [value]);

  return (
    <section className="panel">
      <h2>Blab</h2>
      <input type="text" value={value} onChange={(e) => setValue(e.target.value)} />
    </section>
  );
}
