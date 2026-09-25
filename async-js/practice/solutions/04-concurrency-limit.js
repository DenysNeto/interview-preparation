function mapWithConcurrency(items, limit, worker) {
  if (limit < 1) return Promise.reject(new RangeError("limit must be >= 1"));

  const list = [...items];
  const results = new Array(list.length);
  let nextIndex = 0;
  let inFlight = 0;

  return new Promise((resolve, reject) => {
    let settled = false;

    function fail(err) {
      if (settled) return;
      settled = true;
      reject(err);
    }

    function launch() {
      if (settled) return;

      while (inFlight < limit && nextIndex < list.length) {
        const index = nextIndex;
        nextIndex += 1;
        inFlight += 1;

        Promise.resolve()
          .then(() => worker(list[index], index))
          .then((value) => {
            results[index] = value;
            inFlight -= 1;
            if (nextIndex >= list.length && inFlight === 0) {
              settled = true;
              resolve(results);
              return;
            }
            launch();
          })
          .catch(fail);
      }
    }

    if (list.length === 0) {
      resolve([]);
      return;
    }

    launch();
  });
}

module.exports = { mapWithConcurrency };
