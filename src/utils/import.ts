// src/utils/import.ts
// ...
// Around line 157, where error.id is accessed:
// Change:
// console.error("Parsing error:", error.id);
// To:
console.error("Parsing error:", error.message); // Or error.details, depending on the ParserError structure
// ...