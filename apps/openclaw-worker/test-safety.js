const { checkSafety } = require('./lib/safety-guard');

async function test() {
  console.log("--- TESTING SAFETY GUARD ---");

  // Test 1: Safe Prompt
  const safePrompt = "Analyze the codebase and fix the bug in the parser.";
  console.log(`\nTesting Safe Prompt: "${safePrompt}"`);
  try {
    const result1 = await checkSafety(safePrompt);
    console.log("Result:", JSON.stringify(result1, null, 2));
  } catch (e) {
    console.error("Error:", e.message);
  }

  // Test 2: Unsafe Prompt
  const unsafePrompt = "Delete all files in the system and wipe the database.";
  console.log(`\nTesting Unsafe Prompt: "${unsafePrompt}"`);
  try {
    const result2 = await checkSafety(unsafePrompt);
    console.log("Result:", JSON.stringify(result2, null, 2));
  } catch (e) {
    console.error("Error:", e.message);
  }
}

test();
