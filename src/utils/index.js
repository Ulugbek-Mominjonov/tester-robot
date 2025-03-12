function extractAccountNumber(filename) {
  const match = filename.match(/_(\d+)_/);
  return match ? match[1] : null;
}

function excelDateToJSDate(date) {
  return date.replace(/(\d{2})\.(\d{2})\.(\d{4})/, "$3-$2-$1");
}

function extractTextAndNumber(input) {
  const account = input.split("/");
  return {
    account_number: account[0],
    inn: account[1],
    name: account[2],
  };
}

function formatDate(input) {
  let fullYear, paddedMonth, paddedDay;
  if (input.includes(" ")) {
    const [datePart] = input.split(" ");
    [paddedDay, paddedMonth, fullYear] = datePart.split(".");
  } else {
    // Split the input string
    const [day, month, year] = input.split("/").map(Number);

    // Assume 2-digit year is in 2000s (e.g., 11 -> 2011, adjust if needed)
    fullYear = year < 100 ? 2000 + year : year;

    // Pad day and month with leading zeros
    paddedDay = String(day).padStart(2, "0");
    paddedMonth = String(month).padStart(2, "0");
  }

  // Return in YYYY-MM-DD format
  return `${fullYear}-${paddedMonth}-${paddedDay}`;
}

export {
  extractAccountNumber,
  excelDateToJSDate,
  extractTextAndNumber,
  formatDate,
};
