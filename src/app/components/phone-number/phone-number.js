import { Input } from "@/components/ui/input";
import { useState } from "react";
import { FormatPhoneNumber } from "./format-phone-number";

export default function PhoneNumberInput({ form, initialValue }) {
  const [phoneNumber, setPhoneNumber] = useState(FormatPhoneNumber(initialValue));

  const setValidPhoneNumber = (e) => {
    let newPhoneNumber = e.target.value.replace(/\D/g, '').substring(0, 10);

    form.setValue("phone_number", newPhoneNumber, {
      shouldValidate: false,
      shouldDirty: true,
    });

    if (newPhoneNumber.length > 6) {
      newPhoneNumber = newPhoneNumber.replace(/(\d{3})(\d{3})(\d+)/, "$1-$2-$3");
    } else if (newPhoneNumber.length > 3) {
      newPhoneNumber= newPhoneNumber.replace(/(\d{3})(\d+)/, "$1-$2");
    }
    
    setPhoneNumber(newPhoneNumber);
  }

  return (
    <Input
      className="text-sm"
      value={phoneNumber}
      onChange={setValidPhoneNumber}
    />
  )
}
