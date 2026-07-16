"use strict";

// AI feature archive storage.
// This file exists to keep a placeholder for the removed AI assistant module
// while AI access is disabled for client-facing panel usage.

module.exports = {
  disabled: true,
  archivedAt: "2026-07-03",
  reason: "AI disabled for client access by project request.",
  notes: [
    "AI API routes now return 410 Gone.",
    "AI client widget is removed from index.html.",
    "Previous AI logic is intentionally inactive in runtime."
  ]
};
