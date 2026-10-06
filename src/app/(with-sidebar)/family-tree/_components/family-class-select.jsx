import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NO_CLASS = "__no_family_class__";

export default function FamilyClassSelect({
  id,
  value,
  options,
  onChange,
  disabled = false,
}) {
  return (
    <Select
      value={value || NO_CLASS}
      onValueChange={(nextValue) =>
        onChange(nextValue === NO_CLASS ? "" : nextValue)
      }
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full cursor-pointer">
        <SelectValue placeholder="Choose a class if known" />
      </SelectTrigger>
      <SelectContent className="z-[70]">
        <SelectItem className="cursor-pointer" value={NO_CLASS}>
          Class not listed
        </SelectItem>
        {options.map((className) => (
          <SelectItem
            className="cursor-pointer"
            key={className}
            value={className}
          >
            {className}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
