/**
 * Practice: simplified Promise.all
 *
 * Same contract as Promise.all for an array of values/promises:
 * - fulfill with results in input order when every item fulfills
 * - reject as soon as any item rejects
 * - empty array fulfills with []
 *
 * Run: node 03-promise-all.js
 */

function promiseAll(iterable) {
  // TODO
}

module.exports = { promiseAll };

if (require.main === module) {
  const { promiseAll } = module.exports;

  if (typeof promiseAll !== "function") {
    console.error("Implement promiseAll, then re-run.");
    process.exit(1);
  }

  const delay = (ms, value) =>
    new Promise((resolve) => setTimeout(() => resolve(value), ms));

  Promise.resolve()
    .then(() => promiseAll([1, Promise.resolve(2), delay(10, 3)]))
    .then((result) => {
      const ok = JSON.stringify(result) === JSON.stringify([1, 2, 3]);
      console.log("order + wrapping values:", ok, result);
      if (!ok) throw new Error("fulfill order");
    })
    .then(() => promiseAll([]))
    .then((result) => {
      const ok = Array.isArray(result) && result.length === 0;
      console.log("empty list:", ok);
      if (!ok) throw new Error("empty");
    })
    .then(() =>
      promiseAll([delay(20, "slow"), Promise.reject(new Error("fail"))])
        .then(() => {
          throw new Error("should have rejected");
        })
        .catch((err) => {
          const ok = err && err.message === "fail";
          console.log("fail-fast reject:", ok);
          if (!ok) throw err;
        })
    )
    .then(() => {
      console.log("promiseAll checks passed");
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
