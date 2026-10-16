import ExcelJS from "exceljs";
import { normalize, validateRow, type Difficulty, type Edition, type Mode } from "@culturdle/core";
import { query, tx } from "./db";
import { invalidatePools } from "./pools";

/**
 * Import Culturdle_Question_Bank.xlsx into `puzzles` (design §C3). New rows get `status`;
 * existing rows keep theirs unless forceStatus, so re-importing never undoes review work.
 * Invalid rows are rejected into import_log.
 */
const SHEETS: Record<string, Mode> = { Movies: "movie", Music: "music", Icons: "icon" };

function cellText(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((r) => r.text).join("");
    if ("text" in v) return String((v as any).text);
    if ("result" in v) return String((v as any).result ?? "");
    if (v instanceof Date) return v.toISOString();
  }
  return String(v).trim();
}

export type ImportStatus = "draft" | "reviewed" | "live";

export async function importBank(file: string, opts: { status?: ImportStatus; forceStatus?: boolean } = {}) {
  const status = opts.status ?? "draft";
  const forceStatus = !!opts.forceStatus;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);

  const rows: any[] = [];
  const rejected: { sheet: string; id: string; errors: string[] }[] = [];

  for (const [sheetName, mode] of Object.entries(SHEETS)) {
    const ws = wb.getWorksheet(sheetName);
    if (!ws) throw new Error(`missing sheet ${sheetName}`);
    const header = Array.from(ws.getRow(1).values as ExcelJS.CellValue[], cellText);
    const col = (prefix: string) => header.findIndex((h) => h.toLowerCase().startsWith(prefix.toLowerCase()));
    const C = {
      id: col("ID"), edition: col("Edition"), answerType: col("Answer type"),
      category: Math.max(col("Industry"), col("Category")), difficulty: col("Difficulty"),
      answer: header.findIndex((h) => h === "Answer"),
      aliases: col("Accepted aliases"), year: col("Year"),
      hints: [1, 2, 3, 4, 5, 6].map((n) => col(`Hint ${n}`)),
      wrong: ["A", "B", "C"].map((l) => col(`Wrong option ${l}`)),
      reveal: col("Reveal-card fact"), source: col("Source"), verify: col("Verify flag"),
      meta: ["Director", "Music", "Lead", "Artist"].map((k) => [k.toLowerCase(), header.findIndex((h) => h === k)] as const),
    };
    const seen = new Map<string, string>();
    ws.eachRow((r, n) => {
      if (n === 1) return;
      const v = r.values as ExcelJS.CellValue[];
      const get = (i: number) => (i >= 0 ? cellText(v[i]) : "");
      const id = get(C.id);
      if (!id) return;
      const edition = get(C.edition) as Edition;
      const answer = get(C.answer);
      const hints = C.hints.map(get);
      const wrongOptions = C.wrong.map(get);
      const errors = validateRow({ answer, hints, wrongOptions });
      if (!["Global", "India"].includes(edition)) errors.push(`bad edition ${edition}`);
      const difficulty = get(C.difficulty) as Difficulty;
      if (!["Easy", "Medium", "Hard"].includes(difficulty)) errors.push(`bad difficulty ${difficulty}`);
      if (!answer) errors.push("missing answer");
      const dupKey = `${edition}|${normalize(answer)}`;
      if (seen.has(dupKey)) errors.push(`duplicate answer (also ${seen.get(dupKey)})`);
      if (errors.length) {
        rejected.push({ sheet: sheetName, id, errors });
        return;
      }
      seen.set(dupKey, id);
      const meta: Record<string, string> = {};
      for (const [k, i] of C.meta) if (i >= 0 && get(i)) meta[k] = get(i);
      const yearText = get(C.year);
      rows.push({
        id, edition, mode,
        answer_type: mode === "movie" ? "Film" : get(C.answerType) || "Person",
        category: get(C.category) || null,
        difficulty, answer,
        aliases: get(C.aliases).split("|").map((s) => s.trim()).filter(Boolean),
        year: /^\d{4}$/.test(yearText) ? Number(yearText) : null,
        hints, wrong_options: wrongOptions,
        reveal_fact: get(C.reveal) || null,
        meta, source: get(C.source) || null, verify_flag: get(C.verify) || null,
        status,
      });
    });
  }

  const BATCH = 500;
  await tx(async (q) => {
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = JSON.stringify(rows.slice(i, i + BATCH));
      await q(
        `insert into puzzles (id, edition, mode, answer_type, category, difficulty, answer, aliases, year, hints,
                              wrong_options, reveal_fact, meta, source, verify_flag, status, updated_at)
         select r.id, r.edition::edition, r.mode::mode, r.answer_type, r.category, r.difficulty::difficulty, r.answer,
                array(select jsonb_array_elements_text(r.aliases)), r.year,
                array(select jsonb_array_elements_text(r.hints)),
                array(select jsonb_array_elements_text(r.wrong_options)),
                r.reveal_fact, r.meta, r.source, r.verify_flag, r.status::puzzle_status, now()
         from jsonb_to_recordset($1::jsonb) as r(id text, edition text, mode text, answer_type text, category text,
              difficulty text, answer text, aliases jsonb, year int, hints jsonb, wrong_options jsonb,
              reveal_fact text, meta jsonb, source text, verify_flag text, status text)
         on conflict (id) do update set
           edition = excluded.edition, mode = excluded.mode, answer_type = excluded.answer_type,
           category = excluded.category, difficulty = excluded.difficulty, answer = excluded.answer,
           aliases = excluded.aliases, year = excluded.year, hints = excluded.hints,
           wrong_options = excluded.wrong_options, reveal_fact = excluded.reveal_fact, meta = excluded.meta,
           source = excluded.source, verify_flag = excluded.verify_flag,
           status = ${forceStatus ? "excluded.status" : "puzzles.status"}, updated_at = now()`,
        [chunk],
      );
    }
    await q(`delete from import_log`);
    for (let i = 0; i < rejected.length; i += BATCH) {
      await q(
        `insert into import_log (sheet, row_id, errors)
         select r.sheet, r.id, array(select jsonb_array_elements_text(r.errors))
         from jsonb_to_recordset($1::jsonb) as r(sheet text, id text, errors jsonb)`,
        [JSON.stringify(rejected.slice(i, i + BATCH))],
      );
    }
  });

  const counts = await query(
    `select edition, mode, status, count(*)::int as n from puzzles group by 1,2,3 order by 1,2,3`,
  );
  invalidatePools();
  return { imported: rows.length, rejected, counts };
}
