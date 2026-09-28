"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import MemberAvatar from "./member-avatar";
import styles from "../family-tree.module.css";
import { matchesMemberName } from "@/lib/member-search.mjs";
import FamilyClassSelect from "./family-class-select";

export default function MemberPicker({
  id,
  label,
  members,
  value,
  onChange,
  disabled,
  exclude,
  onCreatePerson,
  classOptions = [],
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createClass, setCreateClass] = useState("");
  const sortedMembers = useMemo(
    () =>
      [...members].sort((a, b) =>
        (a.name || a.uniqname).localeCompare(b.name || b.uniqname),
      ),
    [members],
  );
  const memberById = useMemo(
    () => new Map(members.map((member) => [member.uniqname, member])),
    [members],
  );
  const selected = memberById.get(value);
  const normalizedQuery = query.trim().replace(/\s+/g, " ");
  const canCreate = normalizedQuery.split(" ").length >= 2;
  const alreadyListed = sortedMembers.some(
    (member) =>
      (member.name || "").trim().replace(/\s+/g, " ").toLocaleLowerCase() ===
      normalizedQuery.toLocaleLowerCase(),
  );

  async function createPerson() {
    if (!canCreate || alreadyListed || creating || !onCreatePerson) return;
    setCreating(true);
    setCreateError("");
    try {
      const person = await onCreatePerson(normalizedQuery, createClass);
      onChange(person.uniqname);
      setQuery("");
      setOpen(false);
    } catch (error) {
      setCreateError(error.message || "Could not add this person.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Popover
      modal
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setQuery("");
          setCreateError("");
          setCreateClass("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-haspopup="listbox"
          variant="outline"
          disabled={disabled}
          className="h-12 w-full cursor-pointer justify-between font-normal transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <span className="flex min-w-0 items-center gap-2">
            {selected && <MemberAvatar member={selected} />}
            <span className="truncate">
              {selected?.name || `Choose a ${label.toLowerCase()}`}
            </span>
          </span>
          <ChevronsUpDown className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[60] w-[var(--radix-popover-trigger-width)] overflow-hidden p-0"
      >
        <Command
          filter={(uniqname, query) => {
            const member = memberById.get(uniqname);
            if (!member) return 0;
            const hasClass = String(member.current_class_number || "")
              .toLowerCase()
              .includes(query.trim().toLowerCase());
            return matchesMemberName(member, query) || hasClass ? 1 : 0;
          }}
        >
          <CommandInput
            placeholder="Search name or class…"
            value={query}
            onValueChange={(nextQuery) => {
              setQuery(nextQuery);
              setCreateError("");
            }}
          />
          <CommandList className={styles.familyPickerList}>
            <CommandEmpty>No matching members.</CommandEmpty>
            <CommandGroup>
              {sortedMembers
                .filter((member) => member.uniqname !== exclude)
                .map((member) => (
                  <CommandItem
                    key={member.uniqname}
                    value={member.uniqname}
                    keywords={[
                      member.name || "",
                      member.current_class_number || "",
                    ]}
                    className="min-h-14 cursor-pointer gap-3 px-3"
                    onSelect={() => {
                      onChange(member.uniqname);
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    <MemberAvatar member={member} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {member.name || "Name unavailable"}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {member.current_class_number
                          ? `${member.current_class_number} class`
                          : "Class not listed"}
                      </span>
                    </span>
                    {value === member.uniqname && <Check aria-hidden="true" />}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
        {query.trim() && (
          <div className={styles.createPersonAction}>
            {canCreate && !alreadyListed ? (
              <>
                <label className="mb-1 block text-xs font-medium" htmlFor={`${id}-new-person-class`}>
                  Class (optional)
                </label>
                <FamilyClassSelect
                  id={`${id}-new-person-class`}
                  value={createClass}
                  options={classOptions}
                  onChange={setCreateClass}
                  disabled={disabled || creating}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto w-full justify-start whitespace-normal text-left"
                  disabled={disabled || creating}
                  onClick={createPerson}
                >
                  <span>
                    {creating ? "Adding…" : `Add “${normalizedQuery}” to Family Tree`}
                  </span>
                </Button>
                <p>This adds them to the tree without creating a ZProfile account.</p>
              </>
            ) : canCreate ? (
              <p>Someone with this name is already listed above.</p>
            ) : (
              <p>Enter a full name to add someone who isn’t listed.</p>
            )}
            {createError && <p role="alert">{createError}</p>}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
