const timeUtils = require('./utils/timeUtils');

// Test the cross-midnight time validation
const testCases = [
    {
        startTime: "23:30",
        endTime: "01:30",
        description: "Cross-midnight shift (23:30 to 01:30)"
    },
    {
        startTime: "08:00", 
        endTime: "17:00",
        description: "Normal shift (08:00 to 17:00)"
    },
    {
        startTime: "22:00",
        endTime: "06:00", 
        description: "Night shift (22:00 to 06:00)"
    },
    {
        startTime: "15:00",
        endTime: "12:00",
        description: "Invalid or cross-midnight (15:00 to 12:00)"
    }
];

console.log("Testing isValidTimeRange function:");
console.log("=".repeat(50));

testCases.forEach((testCase, index) => {
    const result = timeUtils.isValidTimeRange(testCase.startTime, testCase.endTime);
    console.log(`${index + 1}. ${testCase.description}`);
    console.log(`   Start: ${testCase.startTime}, End: ${testCase.endTime}`);
    console.log(`   Valid: ${result ? 'YES' : 'NO'}`);
    console.log();
});

// Test time standardization from ISO strings
console.log("Testing time standardization:");
console.log("=".repeat(50));

const isoTestCases = [
    "2025-08-15T23:30:00.000Z",
    "2025-08-16T01:30:00.000Z"
];

isoTestCases.forEach((isoTime, index) => {
    const standardized = timeUtils.standardizeTime(isoTime);
    console.log(`${index + 1}. ${isoTime} → ${standardized}`);
});

// Test the full range validation
console.log("\nTesting full range validation:");
console.log("=".repeat(50));

const startTimeStandardized = timeUtils.standardizeTime("2025-08-15T23:30:00.000Z");
const endTimeStandardized = timeUtils.standardizeTime("2025-08-16T01:30:00.000Z");
const isValid = timeUtils.isValidTimeRange(startTimeStandardized, endTimeStandardized);

console.log(`Original problem:`);
console.log(`Start: 2025-08-15T23:30:00.000Z → ${startTimeStandardized}`);
console.log(`End: 2025-08-16T01:30:00.000Z → ${endTimeStandardized}`);
console.log(`Valid range: ${isValid ? 'YES' : 'NO'}`);
