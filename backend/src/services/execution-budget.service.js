
const DEFAULT_BUDGET_MS = 60_000;

export function createExecutionBudget(
  budgetMs = DEFAULT_BUDGET_MS
) {
  const startedAt = Date.now();

  return {
    startedAt,
    budgetMs,

    elapsedMs() {
      return Date.now() - startedAt;
    },

    remainingMs() {
      return Math.max(
        0,
        budgetMs - this.elapsedMs()
      );
    },

    isExpired() {
      return this.elapsedMs() >= budgetMs;
    },

    assertWithinBudget() {
      if (this.isExpired()) {
        throw new Error(
          "Task execution time budget exceeded."
        );
      }
    },
  };
}
