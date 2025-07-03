export default function termTranslate(term_code) {
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