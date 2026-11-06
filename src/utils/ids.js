export function createId(prefix = 'record') {
  return `${prefix}-${globalThis.crypto.randomUUID()}`;
}

export function nextRecordNumber(records, prefix, year = new Date().getFullYear()) {
  const start = `${prefix}/${year}/`;
  const highest = records.reduce((max, record) => {
    if (!record.number?.startsWith(start)) return max;
    const suffix = record.number.slice(start.length);
    return /^\d+$/.test(suffix) ? Math.max(max, Number(suffix)) : max;
  }, 0);
  return `${start}${String(highest + 1).padStart(4, '0')}`;
}
