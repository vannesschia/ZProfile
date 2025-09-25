import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";

export default function SubmitButton({
  submitting,
  text = "Submit",
}) {
  return (
    <Button className="cursor-pointer w-[80px]" type="submit" disabled={submitting}>
      {submitting ? <Loader2Icon className="animate-spin" /> : text}
    </Button>
  )
}