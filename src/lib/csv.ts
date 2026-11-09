export type CsvCustomer = { name: string; phone: string; email: string | null };

export function normalizePhone(p: string) {
  let n = p.replace(/[^0-9+]/g, "");
  if (n.startsWith("00")) n = "+" + n.slice(2);
  else if (n.startsWith("0")) n = "+31" + n.slice(1);
  else if (n && !n.startsWith("+")) n = "+" + n;
  return n;
}

function splitLine(line: string, sep: string) {
  const out: string[] = []; let cur = ""; let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === sep && !q) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

/** Parses a customer CSV (comma or semicolon). Detects name/phone/email columns by header, else assumes name,phone,email. */
export function parseCustomerCsv(text: string): CsvCustomer[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const sep = (lines[0]!.match(/;/g)?.length ?? 0) > (lines[0]!.match(/,/g)?.length ?? 0) ? ";" : ",";
  const head = splitLine(lines[0]!, sep).map((h) => h.toLowerCase());
  const find = (re: RegExp) => head.findIndex((h) => re.test(h));
  let ni = find(/naam|name/), pi = find(/tel|phone|mobiel|mobile|nummer|number/), ei = find(/mail/);
  const hasHeader = ni >= 0 || pi >= 0;
  if (!hasHeader) { ni = 0; pi = 1; ei = 2; }
  const seen = new Set<string>();
  const rows: CsvCustomer[] = [];
  for (const line of lines.slice(hasHeader ? 1 : 0)) {
    const c = splitLine(line, sep);
    const name = (c[ni] ?? "").slice(0, 100);
    const phone = normalizePhone(c[pi] ?? "");
    if (!name || !/^\+[0-9]{8,15}$/.test(phone) || seen.has(phone)) continue;
    seen.add(phone);
    const email = ei >= 0 && c[ei]?.includes("@") ? c[ei]! : null;
    rows.push({ name, phone, email });
  }
  return rows;
}

/** Build a semicolon-separated CSV (Excel NL friendly) and trigger a download. */
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]) {
  const cell = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
