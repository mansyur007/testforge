import type { TrackTranslation } from "../../types";
import { fundamentalsId } from "./fundamentals";
import { manualProId } from "./manual-pro";

// A-08: the Indonesian text, one module per track, mirroring `../../tracks`.
// A track appears here as soon as its own copy is translated; its lessons
// appear one at a time. Everything not listed here has no Indonesian route —
// `src/content/academy/i18n.ts` explains why that is a 404 rather than a
// fallback to the English body.
//
// Translation conventions, so five slices written weeks apart read as one
// publication:
//
// - **Slugs are never translated.** `/academy/fundamentals/bug-reports` and
//   `/id/academy/fundamentals/bug-reports` are the same page in two languages,
//   which is the claim `hreflang` makes and the reason both must resolve.
// - **Cross-links inside a body point at `/id/academy/…`.** A translated lesson
//   that links to an English one drops the reader out of their language
//   mid-sentence. `scripts/academy-i18n-check.mjs` fails the build on an
//   `/academy/` link in an Indonesian body.
// - **Industry terms stay English, glossed once.** Indonesian QA teams say
//   *test case*, *bug*, *regression*, *boundary value*; translating those into
//   coined Indonesian would make the lesson harder to use at work and useless
//   for reading the English documents the job actually involves. First use in a
//   lesson gets a short gloss, then the English term is used plainly.
// - **Register is *Anda*, not *kamu*.** These are read by working adults and by
//   people using them to get hired.
// - **Code, output, table headers inside code fences, and TestForge UI labels
//   stay verbatim.** The reader is going to type them into a real product whose
//   interface is English.
export const ID_TRACK_TRANSLATIONS: TrackTranslation[] = [fundamentalsId, manualProId];
