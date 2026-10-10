import { useState } from "react";
import { MutateObject } from "./MutateObject.jsx";
import { NotImmediate } from "./NotImmediate.jsx";
import { SameValue } from "./SameValue.jsx";
import { StaleUpdate } from "./StaleUpdate.jsx";

const CASES = [
  ["stale", "Double update", StaleUpdate],
  ["later", "Not immediate", NotImmediate],
  ["mutate", "Mutate object", MutateObject],
  ["same", "Same value", SameValue],
];

export function UseStateDemos() {
  const [current, setCurrent] = useState("stale");
  const Active = CASES.find(([id]) => id === current)[2];

  return (
    <>
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
