const timeUtils = require('./utils/timeUtils');

// Test exactly your case
const startTime = "2025-08-15T23:30:00.000Z";
const endTime = "2025-08-16T01:30:00.000Z";

console.log("Testing your exact case:");
console.log("=".repeat(50));

// Step 1: Standardize times
const finalStartTime = timeUtils.standardizeTime(startTime);
const finalEndTime = timeUtils.standardizeTime(endTime);

console.log(`Original startTime: ${startTime}`);
console.log(`Standardized startTime: ${finalStartTime}`);
console.log(`Original endTime: ${endTime}`);
console.log(`Standardized endTime: ${finalEndTime}`);

// Step 2: Validate time range
const isValid = timeUtils.isValidTimeRange(finalStartTime, finalEndTime);

console.log(`\nTime range validation: ${isValid ? 'PASS ✓' : 'FAIL ✗'}`);

if (isValid) {
    console.log("\n🎉 SUCCESS: The cross-midnight time range is now correctly validated!");
    console.log("Your API should no longer return the 'Invalid time range' error.");
} else {
    console.log("\n❌ FAILED: There's still an issue with the validation logic.");
}

// Test edge cases
console.log("\n" + "=".repeat(50));
console.log("Testing additional edge cases:");

const edgeCases = [
    { start: "00:00", end: "23:59", desc: "Full day" },
    { start: "23:59", end: "00:01", desc: "Very short cross-midnight" },
    { start: "12:00", end: "12:00", desc: "Same time (should fail)" },
    { start: "10:00", end: "09:00", desc: "Cross-midnight morning" }
];

edgeCases.forEach((testCase, index) => {
    const result = timeUtils.isValidTimeRange(testCase.start, testCase.end);
    console.log(`${index + 1}. ${testCase.desc}: ${testCase.start} → ${testCase.end} = ${result ? 'VALID' : 'INVALID'}`);
});
