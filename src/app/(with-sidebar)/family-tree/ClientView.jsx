"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Users,
  PanelRight,
  Maximize2,
  Minimize2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import TreeCanvas from "./_components/tree-canvas";
import MemberDetails from "./_components/member-details";
import MemberAvatar from "./_components/member-avatar";
import styles from "./family-tree.module.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import MemberPicker from "./_components/member-picker";
import { Label } from "@/components/ui/label";
import { layoutFamily, wouldCreateCycle } from "@/lib/family-tree.mjs";
import { matchesMemberName } from "@/lib/member-search.mjs";
import {
  createFamilyTreePerson,
  deleteFamilyTreePerson,
  replaceFamilyRelationship,
  updateFamilyTreeMemberClass,
  updateFamilyTreePerson,
} from "./_lib/actions";

export default function FamilyTree({
  members,
  relationships,
  classOptions = [],
  classOrder = [],
  canEdit = false,
  onChangeRelationship,
  preview = false,
}) {
  const router = useRouter();
  const [people, setPeople] = useState(members);
  const [previewEdges, setPreviewEdges] = useState(relationships);
  const edges = preview ? previewEdges : relationships;
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [focusRevision, setFocusRevision] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isMobile = useIsMobile();
  useEffect(() => {
    const escape = (event) => {
      if (event.key === "Escape" && !document.querySelector('[role="dialog"], [data-state="open"][data-slot="popover-content"]')) setExpanded(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingEdge, setEditingEdge] = useState(null);
  const [replaceBig, setReplaceBig] = useState(false);
  const [big, setBig] = useState("");
  const [little, setLittle] = useState("");
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [creatingPerson, setCreatingPerson] = useState(false);
  const [updatingPerson, setUpdatingPerson] = useState(false);
  const [deletingFamilyPerson, setDeletingFamilyPerson] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
  useEffect(() => setPeople(members), [members]);
  const selected = people.find((m) => m.uniqname === selectedId);
  const memberMap = new Map(people.map((m) => [m.uniqname, m]));
  const connectedMembers = useMemo(() => {
    const memberIds = new Set(people.map((member) => member.uniqname));
    const connectedIds = new Set();
    for (const edge of edges) {
      if (edge.big_uniqname !== edge.little_uniqname && memberIds.has(edge.big_uniqname) && memberIds.has(edge.little_uniqname)) {
        connectedIds.add(edge.big_uniqname);
        connectedIds.add(edge.little_uniqname);
      }
    }
    return people.filter((member) => connectedIds.has(member.uniqname));
  }, [people, edges]);
  const matches = connectedMembers.filter((m) =>
    matchesMemberName(m, search) ||
    String(m.current_class_number || "").toLowerCase().includes(search.trim().toLowerCase()),
  );
  const matchIds = new Set(matches.map((m) => m.uniqname));
  const graph = useMemo(
    () => layoutFamily(connectedMembers, edges, classOrder),
    [connectedMembers, edges, classOrder],
  );
  const bigs = edges.filter((e) => e.little_uniqname === selectedId);
  const littles = edges.filter((e) => e.big_uniqname === selectedId);

  async function save(bigId, littleId, remove = false) {
    if (pending) return;
    setError("");
    const replacement = editingEdge;
    if (!bigId || !littleId || bigId === littleId) {
      setError("Choose two different members.");
      return;
    }
    if (
      replacement &&
      replacement.big_uniqname === bigId &&
      replacement.little_uniqname === littleId
    ) {
      setEditing(false);
      setEditingEdge(null);
      setDetailsOpen(true);
      return;
    }
    const validationEdges = replacement
      ? edges.filter(
          (edge) =>
            edge.big_uniqname !== replacement.big_uniqname ||
            edge.little_uniqname !== replacement.little_uniqname,
        )
      : edges;
    if (
      !remove &&
      validationEdges.some(
        (e) => e.big_uniqname === bigId && e.little_uniqname === littleId,
      )
    ) {
      setError("This relationship already exists.");
      return;
    }
    if (!remove && wouldCreateCycle(validationEdges, bigId, littleId)) {
      setError(
        "This relationship would create a cycle. A member cannot be their own ancestor.",
      );
      return;
    }
    setPending(true);
    try {
      if (preview) {
        const response = await fetch("/family-tree-preview/save?role=admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            replacement
              ? {
                  action: "replace_relationship",
                  old_big_uniqname: replacement.big_uniqname,
                  old_little_uniqname: replacement.little_uniqname,
                  big_uniqname: bigId,
                  little_uniqname: littleId,
                }
              : {
                  big_uniqname: bigId,
                  little_uniqname: littleId,
                  remove,
                },
          ),
        });
        const result = await response.json();
        if (!response.ok) {
          setError(result.error || "Could not save the relationship.");
          return;
        }
        setPreviewEdges(result.relationships);
      } else {
        const result = replacement
          ? await replaceFamilyRelationship(
              replacement.big_uniqname,
              replacement.little_uniqname,
              bigId,
              littleId,
            )
          : await onChangeRelationship(bigId, littleId, remove);
        if (result.error) {
          setError(result.error);
          return;
        }
        router.refresh();
      }
      setEditing(false);
      setEditingEdge(null);
      setReplaceBig(false);
      setRemoving(null);
      if (replacement) setDetailsOpen(true);
      else if (!remove) selectMember(bigId);
      toast.success(
        remove
          ? "Relationship removed"
          : replacement
            ? "Relationship updated"
            : "Relationship added",
      );
    } catch {
      setError("Could not save the relationship. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function createPerson(name, className) {
    if (creatingPerson || pending) throw new Error("Please wait for the current change to finish.");
    setCreatingPerson(true);
    try {
      let person;
      if (preview) {
        const response = await fetch("/family-tree-preview/save?role=admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create_person", name, className }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not add this person.");
        person = result.person;
      } else {
        const result = await createFamilyTreePerson(name, className);
        if (result.error) throw new Error(result.error);
        person = result.person;
      }
      if (!person?.uniqname || !person.name)
        throw new Error("The new person could not be loaded. Please try again.");
      setPeople((current) =>
        current.some((member) => member.uniqname === person.uniqname)
          ? current
          : [...current, person].sort((a, b) =>
              (a.name || a.uniqname).localeCompare(b.name || b.uniqname),
            ),
      );
      toast.success("Person added for the family tree");
      return person;
    } finally {
      setCreatingPerson(false);
    }
  }

  async function updatePerson(personKey, name, className) {
    if (updatingPerson || pending || creatingPerson)
      throw new Error("Please wait for the current change to finish.");
    setUpdatingPerson(true);
    try {
      let person;
      if (preview) {
        const response = await fetch("/family-tree-preview/save?role=admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_person",
            personKey,
            name,
            className,
          }),
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Could not update this person.");
        person = result.person;
      } else {
        const result = await updateFamilyTreePerson(personKey, name, className);
        if (result.error) throw new Error(result.error);
        person = result.person;
      }
      if (!person?.uniqname || !person.name)
        throw new Error("The updated person could not be loaded. Please try again.");
      setPeople((current) =>
        current.map((member) =>
          member.uniqname === person.uniqname ? { ...member, ...person } : member,
        ),
      );
      if (!preview) router.refresh();
      toast.success("Family-tree person updated");
      return person;
    } finally {
      setUpdatingPerson(false);
    }
  }

  async function updateMemberClass(memberKey, className) {
    if (updatingPerson || pending || creatingPerson)
      throw new Error("Please wait for the current change to finish.");
    setUpdatingPerson(true);
    try {
      let result;
      if (preview) {
        const response = await fetch("/family-tree-preview/save?role=admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_member_class",
            memberKey,
            className,
          }),
        });
        result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Could not update this class.");
      } else {
        result = await updateFamilyTreeMemberClass(memberKey, className);
        if (result.error) throw new Error(result.error);
      }
      const member = result.member;
      if (!member?.uniqname || !member.current_class_number)
        throw new Error("The updated class could not be loaded. Please try again.");
      setPeople((current) =>
        current.map((person) =>
          person.uniqname === member.uniqname
            ? { ...person, current_class_number: member.current_class_number }
            : person,
        ),
      );
      if (!preview) router.refresh();
      toast.success("Class updated");
      return member;
    } finally {
      setUpdatingPerson(false);
    }
  }

  async function deletePerson(person) {
    if (
      deletingFamilyPerson ||
      updatingPerson ||
      pending ||
      creatingPerson ||
      !person?.isFamilyTreeOnly
    ) return;
    setDeletingFamilyPerson(true);
    setError("");
    try {
      let result;
      if (preview) {
        const response = await fetch("/family-tree-preview/save?role=admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "delete_person",
            personKey: person.uniqname,
          }),
        });
        result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Could not delete this person.");
      } else {
        result = await deleteFamilyTreePerson(person.uniqname);
        if (result.error) throw new Error(result.error);
      }
      setPeople((current) =>
        current.filter((member) => member.uniqname !== person.uniqname),
      );
      if (preview) {
        setPreviewEdges(
          result.relationships ||
            edges.filter(
              (edge) =>
                edge.big_uniqname !== person.uniqname &&
                edge.little_uniqname !== person.uniqname,
            ),
        );
      } else {
        router.refresh();
      }
      setSelectedId((current) => current === person.uniqname ? null : current);
      setDetailsOpen(false);
      setPersonToDelete(null);
      toast.success("Person deleted from the family tree");
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete this person.");
    } finally {
      setDeletingFamilyPerson(false);
    }
  }

  function selectMember(id) {
    setSelectedId(id);
    setFocusRevision((revision) => revision + 1);
  }

  function openAdd(asBig = true) {
    setEditingEdge(null);
    setReplaceBig(false);
    setBig(asBig ? selectedId || "" : "");
    setLittle(asBig ? "" : selectedId || "");
    setError("");
    setEditing(true);
  }

  function openReplace(edge, replaceBigEndpoint) {
    setEditingEdge(edge);
    setReplaceBig(replaceBigEndpoint);
    setBig(replaceBigEndpoint ? "" : edge.big_uniqname);
    setLittle(replaceBigEndpoint ? edge.little_uniqname : "");
    setError("");
    setDetailsOpen(false);
    setEditing(true);
  }

  const detailProps = selected
    ? {
        member: selected,
        bigs,
        littles,
        memberMap,
        canEdit,
        classOptions,
        pending: pending || updatingPerson || deletingFamilyPerson,
        onUpdatePerson: updatePerson,
        onUpdateMemberClass: updateMemberClass,
        onDeletePerson: (person) => {
          setDetailsOpen(false);
          setPersonToDelete(person);
          setError("");
        },
        onSelect: selectMember,
        onAdd: (asBig) => {
          setDetailsOpen(false);
          openAdd(asBig);
        },
        onEditRelationship: (edge, replaceBigEndpoint) =>
          openReplace(edge, replaceBigEndpoint),
        onRemove: (edge) => {
          setEditingEdge(null);
          setReplaceBig(false);
          setDetailsOpen(false);
          setRemoving(edge);
          setError("");
        },
      }
    : null;
  const replacementUnchanged =
    editingEdge &&
    editingEdge.big_uniqname === big &&
    editingEdge.little_uniqname === little;

  return (
    <div className={`${styles.root} ${expanded ? styles.expanded : ""}`}>
      <header className={styles.graphToolbar}>
        <h1>Family Tree</h1>
        <div className={styles.graphTools}>
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            {isMobile && <PopoverAnchor className={styles.mobileSearchAnchor} />}
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Find a member"
                title="Find a member"
              >
                <Search />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align={isMobile ? "center" : "end"}
              className="w-[min(360px,calc(100vw-32px))] p-2"
            >
              <Input
                aria-label="Search members"
                type="search"
                placeholder="Find a member or class…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <div className={styles.memberResults} aria-label="Search results">
                {matches.length ? (
                  matches.map((member) => (
                    <Button
                      variant="ghost"
                      className="h-auto justify-start whitespace-normal"
                      key={member.uniqname}
                      onClick={() => {
                        selectMember(member.uniqname);
                        setSearch("");
                        setSearchOpen(false);
                      }}
                    >
                      <MemberAvatar member={member} />
                      <span>
                        <strong>{member.name || member.uniqname}</strong>
                        <small>
                          {member.current_class_number
                            ? `${member.current_class_number} class`
                            : "Class not listed"}
                        </small>
                      </span>
                    </Button>
                  ))
                ) : (
                  <p>No matching members.</p>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            disabled={!selected}
            aria-label="View selected member’s connections"
            title="Member details"
            onClick={() => setDetailsOpen(true)}
          >
            <PanelRight />
          </Button>
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Add relationship"
              title="Add relationship"
              disabled={!people.length}
              onClick={() => openAdd()}
            >
              <Plus />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={expanded ? "Exit expanded view" : "Expand tree"}
            title={expanded ? "Exit expanded view" : "Expand tree"}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <Minimize2 /> : <Maximize2 />}
          </Button>
        </div>
      </header>
      {!graph.nodes.length ? (
        <div className={styles.emptyState}>
          <Users size={28} />
          <h2>No connections yet</h2>
          <p>People appear here once they have a big–little connection.</p>
          {canEdit && people.length > 1 && (
            <Button onClick={() => openAdd()}><Plus />Add relationship</Button>
          )}
        </div>
      ) : (
        <TreeCanvas
          graph={graph}
          selectedId={selectedId}
          focusRevision={focusRevision}
          onSelect={selectMember}
          onOpenDetails={() => setDetailsOpen(true)}
          matchIds={matchIds}
          searching={!!search.trim()}
          isMobile={isMobile}
        />
      )}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={isMobile ? styles.mobileSheet : styles.detailsSheet}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Member connections</SheetTitle>
          </SheetHeader>
          {selected && <MemberDetails {...detailProps} />}
        </SheetContent>
      </Sheet>
      <Dialog
        open={editing}
        onOpenChange={(open) => {
          if (!pending) {
            setEditing(open);
            if (!open) {
              if (editingEdge) setDetailsOpen(true);
              setEditingEdge(null);
              setReplaceBig(false);
              setError("");
            }
          }
        }}
      >
        <DialogContent className={styles.relationshipDialog}>
          <DialogHeader>
            <DialogTitle>
              {editingEdge
                ? `Replace ${replaceBig ? "big" : "little"}`
                : "Add relationship"}
            </DialogTitle>
            <DialogDescription>
              {editingEdge
                ? "Choose someone new for this connection. Their other relationships will stay the same."
                : "Choose the big and their little. A new person appears on the tree after you save their first connection."}
            </DialogDescription>
          </DialogHeader>
          {editingEdge ? (
            <div className="space-y-3">
              {[
                {
                  label: "Big",
                  id: replaceBig ? big : editingEdge.big_uniqname,
                  editable: replaceBig,
                  set: setBig,
                  exclude: replaceBig ? little : editingEdge.little_uniqname,
                },
                {
                  label: "Little",
                  id: replaceBig ? editingEdge.little_uniqname : little,
                  editable: !replaceBig,
                  set: setLittle,
                  exclude: replaceBig ? editingEdge.big_uniqname : big,
                },
              ].map(({ label, id, editable, set, exclude }) => {
                const person = memberMap.get(id) || { uniqname: id };
                return (
                  <div key={label} className="space-y-2">
                    <Label
                      htmlFor={
                        editable
                          ? `family-replacement-${label.toLowerCase()}`
                          : undefined
                      }
                    >
                      {label}
                    </Label>
                    {editable ? (
                      <MemberPicker
                        id={`family-replacement-${label.toLowerCase()}`}
                        label={label}
                        members={people}
                        classOptions={classOptions}
                        value={id}
                        onChange={set}
                        onCreatePerson={createPerson}
                        disabled={pending}
                        exclude={exclude}
                      />
                    ) : (
                      <div
                        className={styles.relationshipEndpoint}
                        role="group"
                        aria-label={`${label}: ${person.name || person.uniqname}`}
                      >
                        <MemberAvatar
                          member={person}
                          className={styles.relationshipEndpointAvatar}
                        />
                        <span className={styles.relationshipEndpointText}>
                          <strong>{person.name || person.uniqname}</strong>
                          <small>
                            {person.current_class_number
                              ? `${person.current_class_number} class`
                              : "Class not listed"}
                          </small>
                        </span>
                        <span className={styles.relationshipEndpointStatus}>
                          Unchanged
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            [
              { label: "Big", value: big, set: setBig },
              { label: "Little", value: little, set: setLittle },
            ].map(({ label, value, set }) => (
              <div key={label} className="space-y-2">
                <Label htmlFor={`family-${label}`}>{label}</Label>
                <MemberPicker
                  id={`family-${label}`}
                  label={label}
                  members={people}
                  classOptions={classOptions}
                  value={value}
                  onChange={set}
                  onCreatePerson={createPerson}
                  disabled={pending}
                  exclude={label === "Big" ? little : big}
                />
              </div>
            ))
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={pending || creatingPerson}
              onClick={() => {
                if (!pending) {
                  setEditing(false);
                  if (editingEdge) setDetailsOpen(true);
                  setEditingEdge(null);
                  setReplaceBig(false);
                  setError("");
                }
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={
                pending || creatingPerson || !big || !little || replacementUnchanged
              }
              onClick={() => save(big, little)}
            >
              {pending
                ? "Saving…"
                : editingEdge
                  ? "Save replacement"
                  : "Add relationship"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!removing}
        onOpenChange={(open) => {
          if (!open && !pending) setRemoving(null);
        }}
      >
        <DialogContent className={styles.relationshipDialog}>
          <DialogHeader>
            <DialogTitle>Remove relationship?</DialogTitle>
            <DialogDescription>
              {memberMap.get(removing?.big_uniqname)?.name ||
                removing?.big_uniqname}{" "}
              will no longer be listed as a big of{" "}
              {memberMap.get(removing?.little_uniqname)?.name ||
                removing?.little_uniqname}
              . Other relationships will stay the same.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setRemoving(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                save(removing.big_uniqname, removing.little_uniqname, true)
              }
            >
              {pending ? "Removing…" : "Remove relationship"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!personToDelete}
        onOpenChange={(open) => {
          if (!open && !deletingFamilyPerson) {
            setPersonToDelete(null);
            setError("");
          }
        }}
      >
        <DialogContent className={styles.relationshipDialog}>
          <DialogHeader>
            <DialogTitle>Delete this person?</DialogTitle>
            <DialogDescription>
              This removes {personToDelete?.name || "this person"} and their
              family-tree relationships. It does not affect any ZProfile member
              account.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              disabled={deletingFamilyPerson}
              onClick={() => {
                setPersonToDelete(null);
                setError("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              disabled={deletingFamilyPerson}
              onClick={() => deletePerson(personToDelete)}
            >
              <Trash2 size={16} />
              {deletingFamilyPerson ? "Deleting…" : "Delete person"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
