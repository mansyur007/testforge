// Shared drag-and-drop contract between the cases table (drag source) and the
// suite tree (drop target). Cases are dragged as a JSON array of ids carried on
// this custom MIME type so unrelated drags never register as case moves.
export const CASE_DND_MIME = "application/x-testforge-cases";

// Fired on window after a successful move so the cases table can clear its
// selection (the drop happens in a different component subtree).
export const CASES_MOVED_EVENT = "testforge:cases-moved";
