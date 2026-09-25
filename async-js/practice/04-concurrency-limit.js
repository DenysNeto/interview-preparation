/**
 * Practice: run async work with a concurrency limit.
 *
 * mapWithConcurrency(items, limit, worker):
 * - start at most `limit` worker() calls at the same time
 * - return results in the same order as `items`
 * - if any worker rejects, the returned promise rejects
 *
 * Run: node 04-concurrency-limit.js
 */

function mapWithConcurrency(items, limit, worker) {
  // TODO
}

module.exports = { mapWithConcurrency };

if (require.main === module) {
  const { mapWithConcurrency } = module.exports;

  if (typeof mapWithConcurrency !== "function") {
    console.error("Implement mapWithConcurrency, then re-run.");
    process.exit(1);
  }

  let inFlight = 0;
  let maxInFlight = 0;

  const items = [1, 2, 3, 4, 5, 6];
  const limit = 2;

  mapWithConcurrency(items, limit, async (n) => {
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((r) => setTimeout(r, 30));
    inFlight -= 1;
    return n * 2;
  })
    .then((results) => {
      const orderOk = JSON.stringify(results) === JSON.stringify([2, 4, 6, 8, 10, 12]);
      const limitOk = maxInFlight <= limit;
      console.log("results in input order:", orderOk, results);
      console.log("never exceeded limit:", limitOk, `(max in flight = ${maxInFlight})`);
      process.exit(orderOk && limitOk ? 0 : 1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
