export function termCodeToWords(term_code) {
  let result = "";
  const shift = (term_code - 1200) / 10;
  if (shift % 5 == 1) {
    result += "Fall ";
  } else if (shift % 5 == 2) {
    result += "Winter ";
  } else if (shift % 5 == 3) {
    result += "Spring ";
  } else if (shift % 5 == 4) {
    result += "Spring/Summer ";
  } else {
    result += "Summer ";
  }
  return result += (1998 + Math.trunc((shift + 3) / 5)).toString();
}

export function wordsToTermCode(term) {
  term = term.trim().toLowerCase().replace(/\s+/g, ' ');
  let result = 1210;
  const [season, year] = term.split(' ', 2);
  if (season === "fall") {
    result += (Number(year) - 1998) * 50;
  } else if (season === "winter") {
    result += (Number(year) - 1998) * 50 - 40;
  } else if (season === "spring") {
    result += (Number(year) - 1998) * 50 - 30;
  } else if (season === "spring/summer") {
    result += (Number(year) - 1998) * 50 - 20;
  } else if (season === "summer") {
    result += (Number(year) - 1998) * 50 - 10;
  } else {
    return -1;
  }
  return result;
}

export function isValidTerm(value) {
  value = value.trim().toLowerCase().replace(/\s+/g, ' ');
  const arr = value.split(' ');
  if (arr.length > 2) {
    return false;
  }
  const [season, year] = arr;
  return (["fall", "winter", "spring", "spring/summer", "summer"].includes(season) && Number(year) >= 2000)
}

export const CURRENT_TERM = 2560;