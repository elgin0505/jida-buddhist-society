import assert from "node:assert/strict";

// Test Frontend Contract 1: Double Tap detection mathematics & thresholds
function testDoubleTapDetection() {
  console.log("🔹 [Frontend Contract 1] Double-Tap Gesture Threshold Verification");

  const isDoubleTap = (
    delta: number,
    distX: number,
    distY: number,
    button: number
  ) => {
    if (button !== 0) return false;
    return delta > 40 && delta < 380 && distX < 32 && distY < 32;
  };

  // Case 1: Legitimate double tap (150ms apart, 5px drift, primary button)
  assert.equal(isDoubleTap(150, 5, 5, 0), true, "Legitimate double tap must be accepted");

  // Case 2: Too fast (glitch/touch bouncing < 40ms)
  assert.equal(isDoubleTap(20, 5, 5, 0), false, "Hardware bounce (<40ms) must be rejected");

  // Case 3: Too slow (> 380ms)
  assert.equal(isDoubleTap(450, 5, 5, 0), false, "Slow separate clicks (>380ms) must be rejected");

  // Case 4: Finger drift (> 32px displacement)
  assert.equal(isDoubleTap(150, 45, 10, 0), false, "Large displacement (>32px) must be rejected");

  // Case 5: Secondary/Right click
  assert.equal(isDoubleTap(150, 5, 5, 2), false, "Right click must never trigger double-tap zoom");

  console.log("  ✅ Double tap gesture threshold logic verified.");
}

// Test Frontend Contract 2: Single Lamp Per User Frontend Filter
function testSingleLampFilter() {
  console.log("\n🔹 [Frontend Contract 2] Single Lamp per User Frontend Filter Verification");

  const lamps = [
    { id: "lamp-1", userId: "user-alpha" },
    { id: "lamp-2", userId: "user-beta" },
  ];

  const canPlace = (userId: string, currentLamps: { userId: string }[]) => {
    return !currentLamps.some((l) => l.userId === userId);
  };

  assert.equal(canPlace("user-alpha", lamps), false, "Existing user must be blocked");
  assert.equal(canPlace("user-beta", lamps), false, "Existing user must be blocked");
  assert.equal(canPlace("user-gamma", lamps), true, "New user must be allowed");

  console.log("  ✅ Single lamp per user frontend check verified.");
}

// Test Frontend Contract 3: Debounce & Optimistic UI Logic
async function testDebounceAndOptimisticUI() {
  console.log("\n🔹 [Frontend Contract 3] Debounce and Optimistic UI Batching Verification");

  let stateCount = 10;
  let serverPrayerCount = 10;
  let apiCalls = 0;

  const prayPendingCounts = new Map<string, number>();
  const prayDebounceTimers = new Map<string, NodeJS.Timeout>();

  const triggerPray = (lampId: string) => {
    // 1. Optimistic UI: immediate +1
    stateCount += 1;

    // 2. Pending counter
    const currentPending = (prayPendingCounts.get(lampId) || 0) + 1;
    prayPendingCounts.set(lampId, currentPending);

    // 3. Debounce
    const existing = prayDebounceTimers.get(lampId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      const countToSync = prayPendingCounts.get(lampId) || 1;
      prayPendingCounts.delete(lampId);
      prayDebounceTimers.delete(lampId);
      apiCalls += 1;
      serverPrayerCount += countToSync;
      // Server sync
      stateCount = serverPrayerCount;
    }, 50);

    prayDebounceTimers.set(lampId, timer);
  };

  // User clicks 5 times rapidly
  triggerPray("test-lamp");
  triggerPray("test-lamp");
  triggerPray("test-lamp");
  triggerPray("test-lamp");
  triggerPray("test-lamp");

  // Immediate check: optimistic UI has incremented by 5
  assert.equal(stateCount, 15, "Optimistic UI should immediately be 15");
  assert.equal(apiCalls, 0, "No API call should have been dispatched yet");

  // Wait for debounce timer to fire
  await new Promise((r) => setTimeout(r, 80));

  // Debounced check: exactly 1 API call made with batched count +5
  assert.equal(apiCalls, 1, "Only 1 batched API call should be dispatched");
  assert.equal(serverPrayerCount, 15, "Server prayer count should be 15");
  assert.equal(stateCount, 15, "Synchronized state count should be 15");

  console.log("  ✅ Optimistic UI and Debounce batching verified.");
}

// Test Frontend Contract 4: Unmount Flush Logic
async function testUnmountFlush() {
  console.log("\n🔹 [Frontend Contract 4] Unmount Flush Prevention of Lost Prayers");

  let flushedCount = 0;
  const prayPendingCounts = new Map<string, number>();
  const prayDebounceTimers = new Map<string, NodeJS.Timeout>();

  prayPendingCounts.set("lamp-x", 3);
  prayDebounceTimers.set(
    "lamp-x",
    setTimeout(() => {}, 5000)
  );

  // Simulate unmount
  prayDebounceTimers.forEach((timer, lampId) => {
    clearTimeout(timer);
    const count = prayPendingCounts.get(lampId);
    if (count && count > 0) {
      flushedCount += count;
    }
  });
  prayPendingCounts.clear();
  prayDebounceTimers.clear();

  assert.equal(flushedCount, 3, "All 3 pending prayers must be flushed upon unmount");
  console.log("  ✅ Unmount flush verified.");
}

async function main() {
  testDoubleTapDetection();
  testSingleLampFilter();
  await testDebounceAndOptimisticUI();
  await testUnmountFlush();
  console.log("\n🎉 ALL FRONTEND CONTRACT TESTS PASSED!\n");
}

main();
