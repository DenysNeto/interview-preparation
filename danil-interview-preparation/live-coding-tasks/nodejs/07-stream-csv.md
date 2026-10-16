# 07 — Stream Large CSV Without Full Memory Load

## Statement
Process a potentially large CSV file in Node.js using streams.

Task:
- Read CSV using `createReadStream` + `readline`.
- Parse rows (`id,name,amount`).
- Transform rows (e.g., normalize name, parse amount).
- Either:
  - write JSON lines to output file, or
  - compute aggregate stats (`count`, `sum`, `avg`).

Do not load the entire file into memory.

## Requirements
- TypeScript.
- Stream-based processing.
- Skip header row.
- Handle malformed lines safely (count or log errors).
- Demonstrate backpressure-safe writing if output file is used.

## Time box
40-55 minutes

## What interviewers look for (Что ищут)
- Понимание stream-подхода и memory efficiency.
- Корректная обработка ошибок/битых строк.
- Аккуратная работа с async I/O и завершением потоков.
- Практичность: код, который можно доработать для продакшена.

## Hints
- Используй `readline.createInterface({ input })`.
- `for await (const line of rl)` отлично подходит для построчной обработки.
- Вынеси parse/transform в отдельную функцию.
- При `write()` учитывай, что может вернуться `false` (ждать `drain`).

## Reference solution — complete TypeScript (Express or plain Node)
```ts
import fs from "fs";
import readline from "readline";
import { once } from "events";

type Row = {
  id: string;
  name: string;
  amount: number;
};

function parseCsvLine(line: string): Row | null {
  const [id, name, amountRaw] = line.split(",");
  if (!id || !name || amountRaw === undefined) return null;

  const amount = Number(amountRaw);
  if (Number.isNaN(amount)) return null;

  return {
    id: id.trim(),
    name: name.trim().toLowerCase(),
    amount,
  };
}

async function processCsv(inputPath: string, outputPath: string): Promise<void> {
  const input = fs.createReadStream(inputPath, { encoding: "utf-8" });
  const output = fs.createWriteStream(outputPath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input, crlfDelay: Infinity });

  let lineNo = 0;
  let processed = 0;
  let invalid = 0;
  let sum = 0;

  for await (const line of rl) {
    lineNo += 1;
    if (lineNo === 1) continue; // header
    if (!line.trim()) continue;

    const row = parseCsvLine(line);
    if (!row) {
      invalid += 1;
      continue;
    }

    processed += 1;
    sum += row.amount;

    const asJsonLine = JSON.stringify(row) + "\n";
    if (!output.write(asJsonLine)) {
      await once(output, "drain");
    }
  }

  output.end();
  await once(output, "finish");

  const avg = processed > 0 ? sum / processed : 0;
  console.log({ processed, invalid, sum, avg });
}

processCsv("./input.csv", "./output.jsonl").catch((err) => {
  console.error("CSV processing failed:", err);
  process.exit(1);
});
```

## Follow-up questions
- Как обработать CSV с quoted commas и экранированием?
- Как распараллелить transform без потери порядка?
- Где ставить лимиты/валидацию, чтобы не упасть на плохих данных?
- Как отправлять результаты сразу в БД/очередь вместо файла?
