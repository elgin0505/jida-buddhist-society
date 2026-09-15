/**
 * E2E Test Suite Runner & Verification Harness
 * Project: Jida Buddhist Society (Mobile Performance Refactoring)
 *
 * Implements an independent, zero-dependency, opaque-box test runner
 * providing formatted ANSI terminal output, precise execution timing,
 * and comprehensive test assertion primitives.
 */

import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

export interface TestCase {
  name: string;
  fn: () => void | Promise<void>;
  timeoutMs?: number;
}

export interface TestSuite {
  name: string;
  tier: number;
  cases: TestCase[];
  beforeAllFns: Array<() => void | Promise<void>>;
  afterAllFns: Array<() => void | Promise<void>>;
}

export interface TestResult {
  suiteName: string;
  testName: string;
  status: "passed" | "failed" | "skipped";
  durationMs: number;
  error?: Error;
}

export interface SuiteResult {
  name: string;
  tier: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  tests: TestResult[];
}

// Global registry of test suites
const suites: TestSuite[] = [];
let activeSuite: TestSuite | null = null;
let currentTier = 1;

/** Set the active tier for subsequently defined suites */
export function setTier(tier: number) {
  currentTier = tier;
}

/** Define a test suite */
export function describe(name: string, fn: () => void) {
  const suite: TestSuite = {
    name,
    tier: currentTier,
    cases: [],
    beforeAllFns: [],
    afterAllFns: [],
  };
  suites.push(suite);
  activeSuite = suite;
  fn();
  activeSuite = null;
}

/** Define a test case within the current suite */
export function test(name: string, fn: () => void | Promise<void>, timeoutMs = 10000) {
  if (!activeSuite) {
    throw new Error(`Test "${name}" must be declared inside a describe() block.`);
  }
  activeSuite.cases.push({ name, fn, timeoutMs });
}

export const it = test;

/** Register hook to run before all tests in the current suite */
export function beforeAll(fn: () => void | Promise<void>) {
  if (!activeSuite) {
    throw new Error("beforeAll must be declared inside a describe() block.");
  }
  activeSuite.beforeAllFns.push(fn);
}

/** Register hook to run after all tests in the current suite */
export function afterAll(fn: () => void | Promise<void>) {
  if (!activeSuite) {
    throw new Error("afterAll must be declared inside a describe() block.");
  }
  activeSuite.afterAllFns.push(fn);
}

/** Fluent Matchers wrapper around node:assert/strict */
export function expect<T>(actual: T, defaultMsg?: string) {
  return {
    toBe(expected: any, message?: string) {
      assert.strictEqual(actual, expected, message || defaultMsg);
    },
    toEqual(expected: any, message?: string) {
      assert.deepStrictEqual(actual, expected, message || defaultMsg);
    },
    toBeTruthy(message?: string) {
      assert.ok(Boolean(actual), message || `Expected truthy, received ${String(actual)}`);
    },
    toBeFalsy(message?: string) {
      assert.ok(!Boolean(actual), message || `Expected falsy, received ${String(actual)}`);
    },
    toBeNull(message?: string) {
      assert.strictEqual(actual, null, message);
    },
    toBeUndefined(message?: string) {
      assert.strictEqual(actual, undefined, message);
    },
    toBeDefined(message?: string) {
      assert.notStrictEqual(actual, undefined, message);
    },
    toBeGreaterThan(expected: number, message?: string) {
      assert.ok((actual as any) > expected, message || `Expected ${actual} > ${expected}`);
    },
    toBeGreaterThanOrEqual(expected: number, message?: string) {
      assert.ok((actual as any) >= expected, message || `Expected ${actual} >= ${expected}`);
    },
    toBeLessThan(expected: number, message?: string) {
      assert.ok((actual as any) < expected, message || `Expected ${actual} < ${expected}`);
    },
    toBeLessThanOrEqual(expected: number, message?: string) {
      assert.ok((actual as any) <= expected, message || `Expected ${actual} <= ${expected}`);
    },
    toBeCloseTo(expected: number, precision = 2, message?: string) {
      const diff = Math.abs((actual as any) - expected);
      const tolerance = Math.pow(10, -precision) / 2;
      assert.ok(diff <= tolerance, message || `Expected ${actual} close to ${expected} (tol: ${tolerance})`);
    },
    toContain(expectedItemOrSubstring: any, message?: string) {
      if (typeof actual === "string") {
        assert.ok(
          actual.includes(String(expectedItemOrSubstring)),
          message || `Expected string to contain "${expectedItemOrSubstring}"`
        );
      } else if (Array.isArray(actual)) {
        assert.ok(
          (actual as any[]).includes(expectedItemOrSubstring),
          message || `Expected array to contain item`
        );
      } else if (actual instanceof Set || actual instanceof Map) {
        assert.ok(
          (actual as any).has(expectedItemOrSubstring),
          message || `Expected collection to contain key`
        );
      } else {
        throw new Error(`toContain() target is neither string, array, nor set/map.`);
      }
    },
    toMatch(regex: RegExp, message?: string) {
      assert.ok(
        regex.test(String(actual)),
        message || `Expected "${actual}" to match regex ${regex}`
      );
    },
    toThrow(expectedErrorPattern?: string | RegExp) {
      if (typeof actual !== "function") {
        throw new Error("toThrow() matcher requires a function input.");
      }
      let threw = false;
      let errorThrown: any = null;
      try {
        (actual as any)();
      } catch (err) {
        threw = true;
        errorThrown = err;
      }
      assert.ok(threw, "Expected function to throw an error, but it succeeded.");
      if (expectedErrorPattern) {
        const msg = errorThrown?.message || String(errorThrown);
        if (typeof expectedErrorPattern === "string") {
          assert.ok(
            msg.includes(expectedErrorPattern),
            `Expected error message to contain "${expectedErrorPattern}", got "${msg}"`
          );
        } else {
          assert.ok(
            expectedErrorPattern.test(msg),
            `Expected error message to match ${expectedErrorPattern}, got "${msg}"`
          );
        }
      }
    },
    get not() {
      return {
        toBe(expected: T, message?: string) {
          assert.notStrictEqual(actual, expected, message);
        },
        toEqual(expected: any, message?: string) {
          assert.notDeepStrictEqual(actual, expected, message);
        },
        toContain(itemOrSubstr: any, message?: string) {
          if (typeof actual === "string") {
            assert.ok(
              !actual.includes(String(itemOrSubstr)),
              message || `Expected string NOT to contain "${itemOrSubstr}"`
            );
          } else if (Array.isArray(actual)) {
            assert.ok(
              !(actual as any[]).includes(itemOrSubstr),
              message || `Expected array NOT to contain item`
            );
          }
        },
        toMatch(regex: RegExp, message?: string) {
          assert.ok(
            !regex.test(String(actual)),
            message || `Expected "${actual}" NOT to match regex ${regex}`
          );
        },
      };
    },
  };
}

// Terminal ANSI styling helpers
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  bgGreen: "\x1b[42m",
  bgRed: "\x1b[41m",
  white: "\x1b[37m",
};

/** Measure execution duration in milliseconds */
export async function measureDurationMs(fn: () => void | Promise<void>): Promise<number> {
  const start = performance.now();
  await fn();
  return performance.now() - start;
}

/** DOM and Browser environment emulation mock utilities */
export interface MockBrowserGlobals {
  window: any;
  document: any;
  navigator: any;
  requestAnimationFrame: (cb: FrameRequestCallback) => number;
  cancelAnimationFrame: (id: number) => void;
  IntersectionObserver: any;
}

export function setupMockBrowserEnv(options: { dpr?: number; isMobile?: boolean } = {}): () => void {
  const dpr = options.dpr ?? 2.0;
  const isMobile = options.isMobile ?? false;

  const originalWindow = (globalThis as any).window;
  const originalDocument = (globalThis as any).document;
  const originalNavigator = (globalThis as any).navigator;
  const originalRAF = (globalThis as any).requestAnimationFrame;
  const originalCAF = (globalThis as any).cancelAnimationFrame;
  const originalIO = (globalThis as any).IntersectionObserver;

  // Mock Window
  const mockWindow: any = {
    devicePixelRatio: dpr,
    innerWidth: isMobile ? 390 : 1440,
    innerHeight: isMobile ? 844 : 900,
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: (query: string) => ({
      matches: isMobile ? query.includes("max-width") : false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  };

  // Mock Document
  const mockDocument: any = {
    hidden: false,
    visibilityState: "visible",
    documentElement: {
      classList: {
        contains: (cls: string) => cls === "light",
      },
    },
    createElement: (tag: string) => {
      if (tag === "canvas") {
        return {
          width: 300,
          height: 150,
          style: {},
          getContext: () => ({
            save: () => {},
            restore: () => {},
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            quadraticCurveTo: () => {},
            stroke: () => {},
            fillRect: () => {},
            scale: () => {},
            createLinearGradient: () => ({
              addColorStop: () => {},
            }),
          }),
        };
      }
      return { style: {} };
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  (globalThis as any).window = mockWindow;
  (globalThis as any).document = mockDocument;
  (globalThis as any).navigator = {
    userAgent: isMobile
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
      : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  };
  (globalThis as any).requestAnimationFrame = (cb: any) => setTimeout(cb, 16) as any;
  (globalThis as any).cancelAnimationFrame = (id: any) => clearTimeout(id);

  // Return teardown function
  return () => {
    (globalThis as any).window = originalWindow;
    (globalThis as any).document = originalDocument;
    (globalThis as any).navigator = originalNavigator;
    (globalThis as any).requestAnimationFrame = originalRAF;
    (globalThis as any).cancelAnimationFrame = originalCAF;
    (globalThis as any).IntersectionObserver = originalIO;
  };
}

/** Execute test suites and produce formatted summary */
export async function runAll(options: { tier?: number; filter?: string } = {}): Promise<boolean> {
  const startTime = performance.now();

  console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.yellow}  ☸  JIDA BUDDHIST SOCIETY — E2E TEST SUITE RUNNER  ☸${colors.reset}`);
  console.log(`${colors.dim}  Requirements: R1 (SSR Shell), R2 (Scroll Physics), R3 (Code Splitting),${colors.reset}`);
  console.log(`${colors.dim}                R4 (3D Throttling), R5 (Visual & Functional Integrity)${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  const filteredSuites = suites.filter((s) => {
    if (options.tier && s.tier !== options.tier) return false;
    if (options.filter && !s.name.toLowerCase().includes(options.filter.toLowerCase())) return false;
    return true;
  });

  if (filteredSuites.length === 0) {
    console.log(`${colors.yellow}No test suites matched the given filter.${colors.reset}\n`);
    return true;
  }

  const suiteResults: SuiteResult[] = [];
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const suite of filteredSuites) {
    const suiteStart = performance.now();
    const suiteResult: SuiteResult = {
      name: suite.name,
      tier: suite.tier,
      passed: 0,
      failed: 0,
      skipped: 0,
      durationMs: 0,
      tests: [],
    };

    console.log(`${colors.bold}${colors.blue}▶ [Tier ${suite.tier}] ${suite.name}${colors.reset}`);

    // Run beforeAll hooks
    for (const hook of suite.beforeAllFns) {
      try {
        await hook();
      } catch (err: any) {
        console.error(`  ${colors.red}✖ beforeAll hook failed: ${err?.message}${colors.reset}`);
      }
    }

    // Run test cases
    for (const tc of suite.cases) {
      totalTests++;
      const testStart = performance.now();
      try {
        await tc.fn();
        const testDuration = performance.now() - testStart;
        suiteResult.passed++;
        totalPassed++;
        suiteResult.tests.push({
          suiteName: suite.name,
          testName: tc.name,
          status: "passed",
          durationMs: testDuration,
        });
        console.log(`  ${colors.green}✔${colors.reset} ${tc.name} ${colors.dim}(${testDuration.toFixed(1)}ms)${colors.reset}`);
      } catch (err: any) {
        const testDuration = performance.now() - testStart;
        suiteResult.failed++;
        totalFailed++;
        suiteResult.tests.push({
          suiteName: suite.name,
          testName: tc.name,
          status: "failed",
          durationMs: testDuration,
          error: err,
        });
        console.log(`  ${colors.red}✖ ${tc.name} (${testDuration.toFixed(1)}ms)${colors.reset}`);
        console.log(`    ${colors.red}Error: ${err?.message || err}${colors.reset}`);
        if (err?.stack) {
          const stackLine = err.stack.split("\n")[1] || "";
          console.log(`    ${colors.dim}${stackLine.trim()}${colors.reset}`);
        }
      }
    }

    // Run afterAll hooks
    for (const hook of suite.afterAllFns) {
      try {
        await hook();
      } catch (err: any) {
        console.error(`  ${colors.red}✖ afterAll hook failed: ${err?.message}${colors.reset}`);
      }
    }

    suiteResult.durationMs = performance.now() - suiteStart;
    suiteResults.push(suiteResult);
    console.log();
  }

  const totalDuration = performance.now() - startTime;

  // Print Summary Table
  console.log(`${colors.bold}${colors.cyan}───────────────────────────────────────────────────────────────────────────────${colors.reset}`);
  console.log(`${colors.bold}TEST SUITE EXECUTION SUMMARY${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}───────────────────────────────────────────────────────────────────────────────${colors.reset}`);

  for (const sr of suiteResults) {
    const statusColor = sr.failed === 0 ? colors.green : colors.red;
    const badge = sr.failed === 0 ? "PASSED" : "FAILED";
    console.log(
      `  [Tier ${sr.tier}] ${sr.name.padEnd(46)} ${statusColor}${badge.padEnd(8)}${colors.reset} ` +
      `${colors.green}${sr.passed} passed${colors.reset}, ` +
      `${sr.failed > 0 ? colors.red : colors.dim}${sr.failed} failed${colors.reset} ` +
      `${colors.dim}(${sr.durationMs.toFixed(1)}ms)${colors.reset}`
    );
  }

  console.log(`${colors.bold}${colors.cyan}───────────────────────────────────────────────────────────────────────────────${colors.reset}`);
  console.log(
    `  Total Tests:    ${colors.bold}${totalTests}${colors.reset}\n` +
    `  Passed:         ${colors.green}${colors.bold}${totalPassed}${colors.reset}\n` +
    `  Failed:         ${totalFailed > 0 ? colors.red + colors.bold : colors.dim}${totalFailed}${colors.reset}\n` +
    `  Duration:       ${colors.yellow}${totalDuration.toFixed(1)}ms${colors.reset}`
  );

  if (totalFailed === 0) {
    console.log(`\n  ${colors.bgGreen}${colors.white}${colors.bold} ✔ ALL TESTS PASSED SUCCESSFULLY ${colors.reset}\n`);
    return true;
  } else {
    console.log(`\n  ${colors.bgRed}${colors.white}${colors.bold} ✖ ${totalFailed} TEST(S) FAILED ${colors.reset}\n`);
    return false;
  }
}

/** CLI Entrypoint Dispatcher */
export async function main() {
  const args = process.argv.slice(2);
  let targetTier: number | undefined;
  let targetFilter: string | undefined;

  for (const arg of args) {
    if (arg.startsWith("--tier=")) {
      targetTier = parseInt(arg.replace("--tier=", ""), 10);
    } else if (arg.startsWith("tier")) {
      targetTier = parseInt(arg.replace("tier", ""), 10);
    } else if (arg.startsWith("--filter=")) {
      targetFilter = arg.replace("--filter=", "");
    }
  }

  // Dynamically load test tier definitions
  await import("./tier1-features.test");
  await import("./tier2-boundaries.test");
  await import("./tier3-combinations.test");
  await import("./tier4-workloads.test");

  const success = await runAll({ tier: targetTier, filter: targetFilter });
  if (!success) {
    process.exit(1);
  }
}

// Auto-run when executed directly via CLI
if (
  process.argv[1] &&
  (process.argv[1].endsWith("runner.ts") || process.argv[1].endsWith("runner.js"))
) {
  main().catch((err) => {
    console.error("Test runner encountered an unhandled exception:", err);
    process.exit(1);
  });
}
