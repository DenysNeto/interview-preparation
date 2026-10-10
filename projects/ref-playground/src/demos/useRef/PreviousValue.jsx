import { useEffect, useRef, useState } from "react";
import { stamp } from "../../log.js";

const QUERIES = ["users", "posts", "comments"];

export function PreviousValue() {
  const [query, setQuery] = useState("users");
  const [lines, setLines] = useState([]);
  const prev = useRef(query);

  useEffect(() => {
    const line = stamp("prev", `"${prev.current}" -> "${query}"`);
    setLines((existing) => [...existing.slice(-12), line]);
    prev.current = query;
  }, [query]);

  return (
    <section className="panel">
      <h2>Previous value</h2>
      <p>
        During the effect, <code>prev.current</code> is still the last committed query. The effect
        logs the pair, then stores the new one. The first run is the mount, so both sides match.
      </p>
      <div className="row">
        {QUERIES.map((next) => (
          <button key={next} type="button" aria-pressed={query === next} onClick={() => setQuery(next)}>
            {next}
          </button>
        ))}
      </div>
      <pre className="log">{lines.join("\n")}</pre>
    </section>
  );
}
