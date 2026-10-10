export function stamp(prefix, message) {
  const line = `[${prefix}] ${message}`;
  console.log(line);
  return line;
}
