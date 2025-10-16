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
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

export default function MajorMinorMultiSelect({
  options,
  placeholder,
  value,
  onChange,
  input,
  onInputChange,
  removeFilter,
}) {
  const [open, setOpen] = useState(false);
  const [isWrapped, setIsWrapped] = useState(false);
  const badgeContainerRef = useRef(null);

  useEffect(() => {
    const container = badgeContainerRef.current;
    if (container) {
      setIsWrapped(container.scrollHeight > 36);
    }
  }, [value])

  const toggleOption = (option) => {
    const newSelectedValues = value.includes(option)
      ? value.filter((v) => v !== option).sort((a, b) => a.localeCompare(b))
      : [...value, option].sort((a, b) => a.localeCompare(b));
    onChange(newSelectedValues);
  }

  const handleClear = () => {
    onChange([]);
  }

  const filteredOptions = useMemo(() => {
    return options.filter((option) =>
      option.toLowerCase().includes((input || "").toLowerCase())
    );
  }, [options, input])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(!open)}
          className={`${value.length === 0 ? "pl-3 pr-2" : "px-2"} transition-colors w-full cursor-pointer [&_svg]:pointer-events-auto ${isWrapped ? "h-auto" : "h-9"}`}
        >
          <div className="flex items-center justify-between w-full">
            {value.length === 0 ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-normal text-muted-foreground">{placeholder}</span>
                {removeFilter
                  ? <XIcon
                    className="h-4 cursor-pointer text-muted-foreground"
                    onClick={removeFilter}
                  />
                  : <ChevronDown className="h-4 cursor-pointer text-muted-foreground" />
                }
              </div>
            ) : (
              <div className="flex justify-between items-center w-full">
                <div
                  ref={badgeContainerRef}
                  className="max-w-full overflow-hidden flex flex-wrap items-center gap-1"
                >
                  {value.map((item) => (
                    <Badge key={item}>
                      {item}
                      <XCircle
                        className="cursor-pointer h-4 w-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOption(item);
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
            placeholder="Search majors/minors..."
          />
          <CommandList>
            <CommandEmpty>{input.length === 0 ? "Type to search..." : "No results found"}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => {
                const isSelected = value.includes(option)
                return (
                  <CommandItem
                    key={option}
                    onSelect={() => toggleOption(option)}
                    className="cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <Checkbox checked={isSelected} />
                    <span>{option}</span>
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
