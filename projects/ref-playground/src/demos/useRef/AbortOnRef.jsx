import { useRef, useState } from "react";

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(id);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

export function AbortOnRef() {
  const [status, setStatus] = useState("idle");
  const controllerRef = useRef(null);

  async function load() {
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setStatus("loading");
      await delay(1000, controller.signal);
      setStatus("done");
    } catch (error) {
      if (error.name === "AbortError") return;
      setStatus("error");
    }
  }

  return (
    <section className="panel">
      <h2>AbortController in a ref</h2>
      <p>Each click aborts the previous request and starts a new one.</p>
      <button type="button" onClick={load}>
        Load
      </button>
      <p>Status: {status}</p>
    </section>
  );
}
