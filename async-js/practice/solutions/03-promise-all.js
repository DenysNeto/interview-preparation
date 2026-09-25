function promiseAll(iterable) {
  const items = [...iterable];
  if (items.length === 0) return Promise.resolve([]);

  return new Promise((resolve, reject) => {
    const results = new Array(items.length);
    let remaining = items.length;

    items.forEach((item, index) => {
      Promise.resolve(item).then((value) => {
        results[index] = value;
        remaining -= 1;
        if (remaining === 0) resolve(results);
      }, reject);
    });
  });
}

module.exports = { promiseAll };
