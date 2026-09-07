/**
 * Comprehensive Automated Test Suite for Lotus Sea Lamp Features
 * Covers Module 1, Module 2, Module 3, Edge Cases, API Route Handlers, and Prisma ORM.
 */
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { GET as getLamps, POST as createLamp, DELETE as clearLamps } from "../src/app/api/lamps/route";
import { POST as prayLamp } from "../src/app/api/lamps/[id]/pray/route";

async function runTests() {
  console.log("🚀 Starting Lotus Sea Lamp Test Suite...\n");

  // ==========================================
  // Test 1: Clean slate / Reset Daochang
  // ==========================================
  console.log("🔹 [Test 1] Clear Daochang via DELETE API Handler");
  const deleteReq = new Request("http://localhost:3000/api/lamps", { method: "DELETE" });
  const deleteRes = await clearLamps(deleteReq);
  assert.equal(deleteRes.status, 200, "DELETE /api/lamps should return 200");
  const deleteBody = await deleteRes.json();
  assert.equal(deleteBody.success, true, "DELETE /api/lamps should return success: true");
  console.log("  ✅ Daochang reset confirmed, message:", deleteBody.message);

  // Verify GET returns empty array
  const getResEmpty = await getLamps();
  assert.equal(getResEmpty.status, 200, "GET /api/lamps should return 200");
  const emptyLamps = await getResEmpty.json();
  assert.equal(emptyLamps.length, 0, "GET /api/lamps should return 0 lamps after reset");
  console.log("  ✅ GET /api/lamps correctly returns empty array []");

  // ==========================================
  // Test 2: POST /api/lamps validation (missing userId)
  // ==========================================
  console.log("\n🔹 [Test 2] POST /api/lamps validation (missing userId)");
  const invalidReq = new Request("http://localhost:3000/api/lamps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName: "无名同修", position: [10, 0, 15] }),
  });
  const invalidRes = await createLamp(invalidReq);
  assert.equal(invalidRes.status, 400, "POST without userId should return 400");
  const invalidJson = await invalidRes.json();
  assert.match(invalidJson.error, /userId/, "Should return error about missing userId");
  console.log("  ✅ Correctly blocked request without userId:", invalidJson.error);

  // ==========================================
  // Test 3: POST /api/lamps successful creation
  // ==========================================
  console.log("\n🔹 [Test 3] POST /api/lamps successful first lamp creation");
  const user1 = "test-user-001";
  const validReq1 = new Request("http://localhost:3000/api/lamps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user1,
      userName: "净心同修",
      position: [12.5, 0, 15.2],
      message: "愿吉祥如意",
    }),
  });
  const validRes1 = await createLamp(validReq1);
  assert.equal(validRes1.status, 201, "First lamp creation should return 201");
  const lamp1 = await validRes1.json();
  assert.equal(lamp1.userId, user1);
  assert.equal(lamp1.userName, "净心同修");
  assert.equal(lamp1.prayerCount, 0, "Initial prayerCount must be 0");
  assert.equal(lamp1.posX, 12.5);
  console.log("  ✅ First lamp created with id:", lamp1.id);

  // ==========================================
  // Test 4: Single Lamp Limit (One Lamp Per User)
  // ==========================================
  console.log("\n🔹 [Test 4] Backend single lamp limit (One Lamp Per User)");
  const dupReq = new Request("http://localhost:3000/api/lamps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user1,
      userName: "净心同修重复供灯",
      position: [-5, 0, 10],
      message: "愿再点一盏",
    }),
  });
  const dupRes = await createLamp(dupReq);
  assert.equal(dupRes.status, 400, "Duplicate lamp for same user must return 400");
  const dupJson = await dupRes.json();
  assert.equal(dupJson.error, "每位同修仅限供奉一盏莲灯", "Error message must match specification");
  console.log("  ✅ Correctly rejected second lamp with 400:", dupJson.error);

  // ==========================================
  // Test 5: Second User Can Still Place Lamp
  // ==========================================
  console.log("\n🔹 [Test 5] Different user can successfully place a lamp");
  const user2 = "test-user-002";
  const validReq2 = new Request("http://localhost:3000/api/lamps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user2,
      userName: "慧明同修",
      position: [-10, 0, 14],
      message: "愿国泰民安",
    }),
  });
  const validRes2 = await createLamp(validReq2);
  assert.equal(validRes2.status, 201, "Second user should be able to create lamp");
  const lamp2 = await validRes2.json();
  assert.equal(lamp2.userId, user2);
  console.log("  ✅ Second user lamp created with id:", lamp2.id);

  // Check GET returns 2 lamps
  const getRes2 = await getLamps();
  const lampsList = await getRes2.json();
  assert.equal(lampsList.length, 2, "Should now have 2 lamps in the Daochang");
  console.log("  ✅ GET /api/lamps returns both lamps");

  // ==========================================
  // Test 6: POST /api/lamps/[id]/pray - Atomic Increment
  // ==========================================
  console.log("\n🔹 [Test 6] POST /api/lamps/[id]/pray single increment");
  const prayReq1 = new Request(`http://localhost:3000/api/lamps/${lamp1.id}/pray`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count: 1 }),
  });
  const prayRes1 = await prayLamp(prayReq1, { params: Promise.resolve({ id: lamp1.id }) });
  assert.equal(prayRes1.status, 200, "Pray should return 200");
  const prayBody1 = await prayRes1.json();
  assert.equal(prayBody1.prayerCount, 1, "prayerCount should increment to 1");
  console.log("  ✅ Atomic increment: 1 succeeded, new prayerCount:", prayBody1.prayerCount);

  // ==========================================
  // Test 7: POST /api/lamps/[id]/pray - Debounced Batch Increment
  // ==========================================
  console.log("\n🔹 [Test 7] Debounced batch increment (e.g. 5 prayers in one debounced request)");
  const prayReqBatch = new Request(`http://localhost:3000/api/lamps/${lamp1.id}/pray`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count: 5 }),
  });
  const prayResBatch = await prayLamp(prayReqBatch, { params: Promise.resolve({ id: lamp1.id }) });
  assert.equal(prayResBatch.status, 200, "Batch pray should return 200");
  const prayBodyBatch = await prayResBatch.json();
  assert.equal(prayBodyBatch.prayerCount, 6, "prayerCount should increment from 1 to 6");
  console.log("  ✅ Batch increment +5 succeeded, new prayerCount:", prayBodyBatch.prayerCount);

  // ==========================================
  // Test 8: POST /api/lamps/[id]/pray - Non-existent Lamp (404)
  // ==========================================
  console.log("\n🔹 [Test 8] Pray on non-existent lamp returns 404 (not 500)");
  const prayReqNonExistent = new Request("http://localhost:3000/api/lamps/non-existent-id/pray", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count: 1 }),
  });
  const prayResNonExistent = await prayLamp(prayReqNonExistent, {
    params: Promise.resolve({ id: "non-existent-id" }),
  });
  assert.equal(prayResNonExistent.status, 404, "Non-existent lamp must return 404");
  const nonExistentJson = await prayResNonExistent.json();
  assert.equal(nonExistentJson.error, "未找到该心灯记录");
  console.log("  ✅ Non-existent lamp correctly handled with 404:", nonExistentJson.error);

  // ==========================================
  // Test 9: Re-verifying Daochang Reset and Re-dedication
  // ==========================================
  console.log("\n🔹 [Test 9] Clear Daochang again and verify user1 can place lamp again");
  const finalDeleteRes = await clearLamps(deleteReq);
  assert.equal(finalDeleteRes.status, 200);

  // user1 can place a lamp again after Daochang reset
  const user1RecreateReq = new Request("http://localhost:3000/api/lamps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user1,
      userName: "净心同修（重启后）",
      position: [0, 0, 10],
      message: "从心出发",
    }),
  });
  const user1RecreateRes = await createLamp(user1RecreateReq);
  assert.equal(user1RecreateRes.status, 201, "User should be able to create lamp again after Daochang reset");
  const user1RecreateBody = await user1RecreateRes.json();
  assert.equal(user1RecreateBody.userId, user1);
  console.log("  ✅ User1 successfully placed lamp after reset with id:", user1RecreateBody.id);

  // Clean up test data at the end
  await prisma.lamp.deleteMany({});
  console.log("  🧹 Final test cleanup complete.");

  console.log("\n🎉 ALL 9 TEST CASES PASSED FULLY!\n");
}

runTests()
  .catch((err) => {
    console.error("❌ Test Suite Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
