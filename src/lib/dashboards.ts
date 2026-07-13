// F-17: dashboard grid constants + widget-type catalog, shared by the
// actions, the dashboard pages, and the add-widget form.

export const GRID_COLS = 4;
export const MAX_H = 3;

export const WIDGET_TYPES = [
  { key: "passRateTrend", label: "Pass Rate Trend" },
  { key: "statusPie", label: "Status Distribution" },
  { key: "coverageBar", label: "Automation Coverage" },
  { key: "flakyList", label: "Flaky Tests" },
  { key: "runVelocity", label: "Run Velocity" },
  { key: "textNote", label: "Text Note" },
] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number]["key"];
