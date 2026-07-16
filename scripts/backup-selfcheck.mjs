// L-05: fail the build if the backup's MODEL_ORDER has drifted from the Prisma
// schema. A model that is missing here would be silently dropped from every
// backup — the kind of bug you discover during a restore, which is the worst
// possible moment. Runs in CI before `next build` (see package.json prebuild).
import { checkModelOrder, MODEL_ORDER } from "../src/lib/backup-core.mjs";

const { missing, unknown } = checkModelOrder();

if (missing.length || unknown.length) {
  console.error("✗ backup MODEL_ORDER is out of sync with prisma/schema.prisma\n");
  if (missing.length) {
    console.error(
      `  Models in the schema but not in MODEL_ORDER:\n    ${missing.join(", ")}\n` +
        "  Add each one to MODEL_ORDER in src/lib/backup-core.mjs, positioned AFTER\n" +
        "  every model it has a foreign key to — the restore inserts in that order.\n"
    );
  }
  if (unknown.length) {
    console.error(
      `  Models in MODEL_ORDER but no longer in the schema:\n    ${unknown.join(", ")}\n` +
        "  Remove them from MODEL_ORDER in src/lib/backup-core.mjs.\n"
    );
  }
  process.exit(1);
}

console.log(`✓ backup MODEL_ORDER covers all ${MODEL_ORDER.length} models`);
