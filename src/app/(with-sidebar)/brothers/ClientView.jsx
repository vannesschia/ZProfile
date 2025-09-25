"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import HorizontalMemberCard from "@/app/components/HorizontalMemberCard";
import { Search } from "lucide-react";

const GREEK_ORDER = [ //will need to be changed years later 
  //                     when class names are "alpha beta", etc 
  "alpha", "beta", "gamma", "delta", "epsilon",
  "zeta", "eta", "theta", "iota", "kappa",
  "lambda", "mu", "nu", "xi", "omicron",
  "pi", "rho", "sigma", "tau", "upsilon",
  "phi", "chi", "psi", "omega",
];

const greekIndex = Object.fromEntries(
  GREEK_ORDER.map((g, i) => [g, i]) // alpha=0, beta=1, ...
);

function sectionComparator([aKey], [bKey]) {
  const a = String(aKey ?? "").trim().toLowerCase();
  const b = String(bKey ?? "").trim().toLowerCase();
  return (greekIndex[b] ?? Infinity) - (greekIndex[a] ?? Infinity);
}

export default function ClientMembersView({ members }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const safeMembers = Array.isArray(members) ? members : [];

  const grouped = safeMembers.reduce((acc, member) => {
    const className = (member.current_class_number || "").trim();
    if (!className) return acc; // skip empty labels; they won't be shown
    if (!acc[className]) acc[className] = [];
    acc[className].push(member);
    return acc;
  }, {});

  Object.values(grouped).forEach((classMembers) => {
    classMembers.sort((a, b) => a.name.localeCompare(b.name));
  });

  return (
    <div>
      <div className="relative w-full lg:w-1/2 xl:w-1/4 mb-8">
        <Search className="text-muted-foreground pointer-events-none absolute pl-2 top-1/2 -translate-y-1/2" />
        <Input
          type="search"
          className="pl-8 text-sm"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-24 ml-4 justify-between"
          >
            {value
              ? frameworks.find((framework) => framework.value === value)?.label
              : "Search majors"}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-24 p-0">
          <Command>
            <CommandInput placeholder="Search majors" className="h-9" />
            <CommandList>
              <CommandEmpty>No majors found.</CommandEmpty>
              <CommandGroup>
                {frameworks.map((framework) => (
                  <CommandItem
                    key={framework.value}
                    value={framework.value}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue)
                      setOpen(false)
                    }}
                  >
                    {framework.label}
                    <Check
                      className={cn(
                        "ml-auto",
                        value === framework.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {Object.entries(grouped)
        .sort(sectionComparator) // α → β → γ → …
        .map(([className, classMembers]) => {
          const filtered = classMembers.filter((m) =>
            m.name.toLowerCase().includes(search.toLowerCase())
          );
          if (filtered.length === 0) return null;

          return (
            <section key={className} className="mb-10">
              <h2 className="text-xl font-semibold mb-4">
                {className}
              </h2>
              <div className="flex flex-wrap gap-4 justify-start items-start">
                {filtered.map((member) => (
                  <HorizontalMemberCard key={member.uniqname} member={member} />
                ))}
              </div>
            </section>
          );
        })}
    </div>
  );
}
