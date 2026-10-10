import { useState } from "react";
import { UseCallbackDemos } from "./demos/useCallback/index.jsx";
import { UseRefDemos } from "./demos/useRef/index.jsx";
import { UseStateDemos } from "./demos/useState/index.jsx";
import { PaginationTable } from "./demos/pagination/PaginationTable.jsx";
import { TodoApp } from "./demos/todo/TodoApp.jsx";
import { WeatherDashboard } from "./demos/weather/WeatherDashboard.jsx";

const DEMOS = [
  ["ref", "useRef", UseRefDemos],
  ["state", "useState", UseStateDemos],
  ["callback", "useCallback", UseCallbackDemos],
  ["todo", "Todo", TodoApp],
  ["pages", "Pages", PaginationTable],
  ["weather", "Weather", WeatherDashboard],
];

export default function App() {
  const [current, setCurrent] = useState("ref");
  const Active = DEMOS.find(([id]) => id === current)[2];

  return (
    <>
      <h1>Hook playground</h1>
      <p>
        Open the browser console. Each tab is one hook, except Todo, Pages, and Weather. Cases that log print the same lines in the panel.
      </p>
      <nav className="nav">
        {DEMOS.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={current === id} onClick={() => setCurrent(id)}>
            {label}
          </button>
        ))}
      </nav>
      <Active />
    </>
  );
}
