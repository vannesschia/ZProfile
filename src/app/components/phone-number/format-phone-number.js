// function to insert hyphens into phone number
export function FormatPhoneNumber(phoneNumber) {
  return phoneNumber.replace(/(\d{3})(\d{3})(\d+)/, "$1-$2-$3");
}