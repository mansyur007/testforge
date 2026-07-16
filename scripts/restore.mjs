// L-05: restore a `.tfbackup` into this instance from the command line.
//
//   node scripts/restore.mjs <file>                  # fresh instance only
//   node scripts/restore.mjs <file> --force-wipe     # erase this instance first
//   node scripts/restore.mjs <file> --force-wipe --yes   # skip the prompt (CI)
//
// The engine is shared with the in-app restore (src/lib/backup-core.mjs) so the
// two paths cannot drift. Plain node on purpose: this runs on a fresh instance
// where a TS loader and devDependencies may not exist.
//
// DATABASE_URL / TF_UPLOAD_DIR / TF_SECRET are read from the environment, the
// same as the app. Point them at the instance you are restoring INTO.
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import process from "node:process";
import { PrismaClient } from "@prisma/client";
import { restoreBackup, isFresh, RestoreRefused } from "../src/lib/backup-core.mjs";

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const file = args.find((a) => !a.startsWith("--"));
const forceWipe = flags.has("--force-wipe");
const yes = flags.has("--yes");

for (const f of flags) {
  if (!["--force-wipe", "--yes"].includes(f)) {
    console.error(`Unknown flag: ${f}`);
    process.exit(2);
  }
}

if (!file) {
  console.error(
    "Usage: node scripts/restore.mjs <file.tfbackup> [--force-wipe] [--yes]\n\n" +
      "  --force-wipe  erase this instance before importing (asks first)\n" +
      "  --yes         skip the confirmation prompt\n"
  );
  process.exit(2);
}

const buffer = await fs.readFile(path.resolve(file)).catch((e) => {
  console.error(`Cannot read ${file}: ${e.message}`);
  process.exit(2);
});

const db = new PrismaClient();

async function confirmWipe() {
  if (yes) return true;
  if (!process.stdin.isTTY) {
    console.error(
      "--force-wipe erases this instance and stdin is not a terminal, so it cannot ask.\n" +
        "Re-run with --yes if you are certain."
    );
    return false;
  }
  const [users, projects] = await Promise.all([db.user.count(), db.project.count()]);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log(
    `\n--force-wipe will PERMANENTLY DELETE everything in this instance` +
      ` (${users} user${users === 1 ? "" : "s"}, ${projects} project${projects === 1 ? "" : "s"})` +
      `\nDATABASE_URL: ${process.env.DATABASE_URL ?? "(default)"}\n` +
      `It will then import ${path.basename(file)}.\n`
  );
  const answer = await rl.question('Type "yes" to continue: ');
  rl.close();
  return answer.trim().toLowerCase() === "yes";
}

try {
  if (forceWipe) {
    if (!(await confirmWipe())) {
      console.error("Aborted — nothing was changed.");
      process.exit(1);
    }
  } else if (!(await isFresh(db))) {
    // Say this before reading the archive so the advice is the first thing seen.
    console.error(
      "This instance already has data. Restore only runs on a fresh instance\n" +
        "(at most one user and no projects). Re-run with --force-wipe to erase it first."
    );
    process.exit(1);
  }

  const summary = await restoreBackup(buffer, { db, wipe: forceWipe });
  const totalRows = Object.values(summary.rowCounts).reduce((a, b) => a + b, 0);

  console.log(`\n✓ Restored ${path.basename(file)}`);
  console.log(`  taken ${summary.createdAt} by TestForge ${summary.appVersion}`);
  if (summary.rowsWiped) console.log(`  erased ${summary.rowsWiped} pre-existing rows`);
  for (const [model, n] of Object.entries(summary.rowCounts)) {
    if (n > 0) console.log(`  ${String(n).padStart(6)}  ${model}`);
  }
  console.log(`  ${String(summary.filesCopied).padStart(6)}  attachment files`);
  console.log(`  ${totalRows} rows total in ${(summary.elapsedMs / 1000).toFixed(1)}s`);
  if (summary.integrationsDeactivated) {
    console.log(
      `\n  ⚠ ${summary.integrationsDeactivated} integration(s) imported as INACTIVE: this\n` +
        `    instance's TF_SECRET does not match the one that wrote the backup, so their\n` +
        `    stored credentials cannot be decrypted. Re-enter them to re-enable.`
    );
  }
  console.log("\nLog in with any account from the backup — passwords carry over.\n");
} catch (e) {
  if (e instanceof RestoreRefused) {
    console.error(`\n✗ Refused: ${e.message}\n\nThe database was not modified.`);
    process.exit(1);
  }
  console.error(`\n✗ Restore failed: ${e.message}`);
  console.error(
    "The database was rolled back and is unchanged. Any attachment files already\n" +
      "copied are inert without their rows and can be left in place."
  );
  process.exit(1);
} finally {
  await db.$disconnect();
}
