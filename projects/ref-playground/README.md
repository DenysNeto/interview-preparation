# Hook playground

Runnable versions of the hook patterns in [the React guide](../../react/react.md).

```bash
cd projects/ref-playground
npm install
npm run dev
```

Open the printed local URL and the browser console. Each demo logs with a prefix: `latest`, `debounce`, `prev`, or `abort`. The same lines appear in the black panel.

| Demo | What to try | What you should see |
| --- | --- | --- |
| Latest callback | Switch the label while it ticks | `interval started` once (twice in Strict Mode: start, cleanup, start). Later ticks print the new label. |
| Debounce timer | Type several characters, then pause | One `keystroke` line per character. One `query fired` line after 500ms of silence. |
| Previous value | Click another query | `"users" -> "posts"` style lines. The first line is the mount, so both sides match. |
| Abort controller | Click Load twice quickly | Request `#1` aborted, request `#2` completed about a second later. |
| useState | Open the four cases under the useState tab | A second `setCount(count + 1)` is ignored; the screen lags behind `console.log`; mutating an object does not render; setting the same number does not render, but a new object does. |
| useCallback | Open the three cases under the useCallback tab | A stable callback lets a memo child skip; an empty dependency list keeps the first count; an inline callback restarts an effect on every parent render. |
| Todo | Add a task, mark it done, switch Open and Done, then remove it | The input clears after add. Done tasks stay in the list but disappear from Open. The open count is calculated from the list. |
| Pages | Open page 2, then Next | Five rows per page. Page 1 starts at Ada Lovelace. Page 2 starts at Linus Torvalds. Next is disabled on the last page. |
| Weather | Fill in the starter on the Weather tab | The pasted markup only. Search, weather data, and previous searches are left for you to implement. |
