import { Button } from "@/components/ui/button";
import { FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function ImageUpload({
  image,
  setImage,
  message,
}) {
  return (
    <>
      <Input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={(e) => setImage(e.target.files?.[0] || null)}
        id="image-upload-button"
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => document.getElementById("image-upload-button")?.click()}
        className="w-full font-normal cursor-pointer justify-start text-left px-3"
      >
        {image ? image.name : "Choose File"}
      </Button>
      <FormDescription>{message}</FormDescription>
    </>
  )
}