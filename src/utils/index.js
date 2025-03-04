function extractAccountNumber(filename) {
  const match = filename.match(/_(\d+)_/);
  return match ? match[1] : null;
}

function excelDateToJSDate(date) {
  return date.replace(/(\d{2})\.(\d{2})\.(\d{4})/, "$3-$2-$1");
}

function extractTextAndNumber(input) {
  const match = input.match(/(.+?)\s*(\d{9})$/);
  if (match) {
    return { text: match[1].trim(), number: match[2] };
  } else {
    return { text: input.trim(), number: "000000000" };
  }
}


export { extractAccountNumber, excelDateToJSDate, extractTextAndNumber };
