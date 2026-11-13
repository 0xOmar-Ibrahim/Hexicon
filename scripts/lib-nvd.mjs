// Streaming reader for NVD JSON 2.0 yearly feeds.
// Recent feeds are too large to turn into one JavaScript string (ERR_STRING_TOO_LONG), so we walk the
// decompressed bytes and parse one `vulnerabilities[]` entry at a time.
import fs from 'node:fs';
import zlib from 'node:zlib';

const QUOTE = 0x22, BACKSLASH = 0x5c, OPEN = 0x7b, CLOSE = 0x7d;

/** Yields each `{ "cve": … }` object of an NVD feed file (.json.gz). If `wanted` is a Set of CVE IDs,
 *  only entries whose text contains one of them are parsed. */
export function* readNvdFeed(file, wanted = null) {
  const buf = zlib.gunzipSync(fs.readFileSync(file));
  let i = buf.indexOf('"vulnerabilities"');
  if (i < 0) return;
  i = buf.indexOf('[', i) + 1;
  while (i < buf.length) {
    const start = buf.indexOf(OPEN, i);
    if (start < 0) break;
    let depth = 0, inStr = false, j = start;
    for (; j < buf.length; j++) {
      const c = buf[j];
      if (inStr) {
        if (c === BACKSLASH) j++;
        else if (c === QUOTE) inStr = false;
      } else if (c === QUOTE) inStr = true;
      else if (c === OPEN) depth++;
      else if (c === CLOSE && --depth === 0) break;
    }
    const slice = buf.subarray(start, j + 1);
    i = j + 1;
    if (wanted) {
      const m = /"id"\s*:\s*"(CVE-\d{4}-\d+)"/.exec(slice.subarray(0, 200).toString('utf8'));
      if (!m || !wanted.has(m[1])) continue;
    }
    try { yield JSON.parse(slice.toString('utf8')); } catch { /* skip malformed entry */ }
  }
}
