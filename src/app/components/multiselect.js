'use client'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown, XCircle, XIcon } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

export default function MultiSelect({
  termValidity,
  options,
  placeholder,
  onChange,
  input,
  onInputChange,
  form,
  index
}) {
  const [open, setOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState([]);
  const [isWrapped, setIsWrapped] = useState(false);
  const badgeContainerRef = useRef(null);

  useEffect(() => {
    const container = badgeContainerRef.current;
    if (container) {
      setIsWrapped(container.scrollHeight > 36);
    }
  }, [selectedValues])

  useEffect(() => {
    if (!termValidity) {
      handleClear();
      setOpen(false);
    }
  }, [termValidity])

  useEffect(() => {
    const currentSelected = form.getValues(`courses.${index}.classes`) || [];
    setSelectedValues(currentSelected);
  }, [form])

  const toggleOption = (option) => {
    const newSelectedValues = selectedValues.includes(option)
      ? selectedValues.filter((value) => value !== option).sort((a, b) => a.localeCompare(b))
      : [...selectedValues, option].sort((a, b) => a.localeCompare(b));
    setSelectedValues(newSelectedValues);
    form.setValue(`courses.${index}.classes`, newSelectedValues, {
      shouldValidate: false,
      shouldDirty: true,
    });
    onChange(newSelectedValues);
  }

  const handleClear = () => {
    form.setValue(`courses.${index}.classes`, [], {
      shouldValidate: false,
      shouldDirty: true,
    });
    setSelectedValues([]);
  }

  const filteredOptions = useMemo(() => {
    return options.filter((option) =>
      option.className.toLowerCase().includes((input || "").toLowerCase())
    );
  }, [options, input])

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      if (!termValidity) {
        setOpen(false);
      } else {
        setOpen(isOpen);
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (!termValidity) {
              form.setError(`courses.${index}.classes`, {
                type: "manual",
                message: "Select a valid term",
              });
            } else {
              setOpen(!open);
              form.clearErrors(`courses.${index}.classes`);
            }
          }}
          className={`${selectedValues.length === 0 ? "" : "px-2"} w-full cursor-pointer [&_svg]:pointer-events-auto ${isWrapped ? "h-auto" : "h-9"}`}
        >
          <div className="flex items-center justify-between w-full">
            {selectedValues.length === 0 ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-muted-foreground">{placeholder}</span>
                <ChevronDown className="h-4 cursor-pointer text-muted-foreground" />
              </div>
            ) : (
              <div className="flex justify-between items-center w-full">
                <div
                  ref={badgeContainerRef}
                  className="max-w-full overflow-hidden flex flex-wrap items-center gap-1"
                >
                  {selectedValues.map((course) => (
                    <Badge key={course}>
                      {course}
                      <XCircle
                        className="cursor-pointer h-4 w-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOption(course);
                        }}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center">
                  <XIcon
                    className="h-4 cursor-pointer text-muted-foreground mx-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                  />
                  <Separator orientation="vertical" className="flex min-h-5 mr-2" />
                  <ChevronDown className="h-4 cursor-pointer text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" onEscapeKeyDown={() => setOpen(false)}>
        <Command shouldFilter={false}>
          <CommandInput
            value={input}
            onValueChange={onInputChange}
            placeholder="Search courses"
          />
          <CommandList>
            <CommandEmpty>{input.length === 0 ? "" : "No classes found"}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.className)
                return (
                  <CommandItem
                    key={option.className}
                    onSelect={() => toggleOption(option.className)}
                    className="cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <Checkbox checked={isSelected} />
                    <div className="flex flex-col">
                      <span className="font-semibold">{option.className}</span>
                      <span>{option.classDescription}</span>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}