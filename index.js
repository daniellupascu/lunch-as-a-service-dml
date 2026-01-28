import { generateCalendar } from "./utils.js";

async function main() {
    console.log("Generating calendar...");
    await generateCalendar();
    console.log("Calendar generated successfully");
}

main();