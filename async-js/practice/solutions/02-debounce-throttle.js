function debounce(fn, wait) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

function throttle(fn, wait) {
  let last = 0;
  let timer;
  return function (...args) {
    const now = Date.now();
    const remaining = wait - (now - last);
    const run = () => {
      last = Date.now();
      fn.apply(this, args);
    };
    if (remaining <= 0) {
      clearTimeout(timer);
      run();
    } else {
      clearTimeout(timer);
      timer = setTimeout(run, remaining);
    }
  };
}

module.exports = { debounce, throttle };
