/**
 * Practice: implement debounce and throttle.
 *
 * Debounce: run fn only after `wait` ms with no new calls.
 * Throttle: run fn at most once per `wait` ms (trailing + leading is fine).
 *
 * Run: node 02-debounce-throttle.js
 */

function debounce(fn, wait) {
  // TODO
}

function throttle(fn, wait) {
  // TODO
}

module.exports = { debounce, throttle };

if (require.main === module) {
  const { debounce: d, throttle: t } = module.exports;

  if (typeof d !== "function" || typeof t !== "function") {
    console.error("Implement debounce and throttle, then re-run.");
    process.exit(1);
  }

  let debouncedCount = 0;
  const debounced = d(() => {
    debouncedCount += 1;
  }, 50);

  debounced();
  debounced();
  debounced();

  let throttledCount = 0;
  const throttled = t(() => {
    throttledCount += 1;
  }, 80);

  throttled();
  throttled();
  throttled();

  setTimeout(() => {
    const debounceOk = debouncedCount === 1;
    const throttleOk = throttledCount >= 1 && throttledCount <= 2;
    console.log("debounce called once after burst:", debounceOk, `(count=${debouncedCount})`);
    console.log("throttle limited the burst:", throttleOk, `(count=${throttledCount})`);
    process.exit(debounceOk && throttleOk ? 0 : 1);
  }, 200);
}
