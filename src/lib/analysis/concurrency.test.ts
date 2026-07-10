import assert from "node:assert/strict";
import test from "node:test";

import { mapWithConcurrency } from "@/lib/analysis/concurrency";

test("mapWithConcurrency keeps output order and respects its worker bound", async () => {
  let active = 0;
  let peak = 0;

  const results = await mapWithConcurrency([30, 5, 20, 10], 2, async (delay) => {
    active += 1;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, delay));
    active -= 1;
    return delay * 2;
  });

  assert.deepEqual(results, [60, 10, 40, 20]);
  assert.equal(peak, 2);
});
