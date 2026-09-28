import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpLeft,
  Check,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MemberAvatar from "./member-avatar";
import FamilyClassSelect from "./family-class-select";
import styles from "../family-tree.module.css";

export default function MemberDetails({
  member,
  bigs,
  littles,
  memberMap,
  canEdit,
  classOptions = [],
  pending = false,
  onSelect,
  onAdd,
  onEditRelationship,
  onRemove,
  onUpdatePerson,
  onUpdateMemberClass,
  onDeletePerson,
}) {
  const [editingPerson, setEditingPerson] = useState(false);
  const [editingMemberClass, setEditingMemberClass] = useState(false);
  const [draftName, setDraftName] = useState(member.name || "");
  const [draftClass, setDraftClass] = useState(member.current_class_number || "");
  const [savingPerson, setSavingPerson] = useState(false);
  const [editError, setEditError] = useState("");
  const hasClass = Boolean(String(member.current_class_number || "").trim());

  useEffect(() => {
    setEditingPerson(false);
    setEditingMemberClass(false);
    setDraftName(member.name || "");
    setDraftClass(member.current_class_number || "");
    setEditError("");
  }, [member.uniqname, member.name, member.current_class_number]);

  async function savePerson() {
    if (savingPerson || pending) return;
    setSavingPerson(true);
    setEditError("");
    try {
      await onUpdatePerson(member.uniqname, draftName, draftClass);
      setEditingPerson(false);
    } catch (error) {
      setEditError(error.message || "Could not update this person.");
    } finally {
      setSavingPerson(false);
    }
  }

  async function saveMemberClass() {
    if (savingPerson || pending) return;
    setSavingPerson(true);
    setEditError("");
    try {
      await onUpdateMemberClass(member.uniqname, draftClass);
      setEditingMemberClass(false);
    } catch (error) {
      setEditError(error.message || "Could not update this class.");
    } finally {
      setSavingPerson(false);
    }
  }

  return (
    <aside className={styles.details} aria-label="Selected member">
      <div className={styles.memberProfile}>
        <div className={styles.memberIdentity}>
          <MemberAvatar member={member} className={styles.profileAvatar} />
          <div className={styles.memberIdentityText}>
            <h2>{member.name || member.uniqname}</h2>
            <div className={styles.profileMeta}>
              <span>
                {hasClass
                  ? `${member.current_class_number} class`
                  : "Class not listed"}
              </span>
            </div>
          </div>
        </div>
        {member.isFamilyTreeOnly && canEdit && !editingPerson && (
          <div className="mt-3 flex w-full gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 cursor-pointer"
              disabled={pending}
              onClick={() => {
                setDraftName(member.name || "");
                setDraftClass(member.current_class_number || "");
                setEditError("");
                setEditingPerson(true);
              }}
            >
              <Pencil size={15} />
              Edit name or class
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="cursor-pointer"
              disabled={pending}
              onClick={() => onDeletePerson(member)}
            >
              <Trash2 size={15} />
              Delete
            </Button>
          </div>
        )}
        {member.isFamilyTreeOnly && canEdit && editingPerson && (
          <div className="mt-4 w-full space-y-3 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="family-tree-person-name">Name</Label>
              <Input
                id="family-tree-person-name"
                value={draftName}
                maxLength={120}
                disabled={savingPerson || pending}
                onChange={(event) => setDraftName(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="family-tree-person-class">Class (optional)</Label>
              <FamilyClassSelect
                id="family-tree-person-class"
                value={draftClass}
                options={classOptions}
                onChange={setDraftClass}
                disabled={savingPerson || pending}
              />
            </div>
            {editError && (
              <p role="alert" className="text-sm text-destructive">
                {editError}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 cursor-pointer"
                disabled={savingPerson}
                onClick={() => setEditingPerson(false)}
              >
                <X size={15} />
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 cursor-pointer"
                disabled={savingPerson || pending || draftName.trim().length < 2}
                onClick={savePerson}
              >
                <Check size={15} />
                {savingPerson ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        )}
        {!member.isFamilyTreeOnly && canEdit && !editingMemberClass && (
          <div className="mt-3 flex w-full">
            <Button
              type="button"
              variant="outline"
              className="w-full cursor-pointer"
              disabled={pending}
              onClick={() => {
                setDraftClass(member.current_class_number || "");
                setEditError("");
                setEditingMemberClass(true);
              }}
            >
              <Pencil size={15} />
              Edit class
            </Button>
          </div>
        )}
        {!member.isFamilyTreeOnly && canEdit && editingMemberClass && (
          <div className="mt-4 w-full space-y-3 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="family-tree-member-class">Class</Label>
              <FamilyClassSelect
                id="family-tree-member-class"
                value={draftClass}
                options={classOptions}
                onChange={setDraftClass}
                disabled={savingPerson || pending}
              />
            </div>
            {editError && (
              <p role="alert" className="text-sm text-destructive">
                {editError}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 cursor-pointer"
                disabled={savingPerson}
                onClick={() => setEditingMemberClass(false)}
              >
                <X size={15} />
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 cursor-pointer"
                disabled={savingPerson || pending || !draftClass}
                onClick={saveMemberClass}
              >
                <Check size={15} />
                {savingPerson ? "Saving…" : "Save class"}
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className={styles.relationshipSections}>
        {[
          {
            title: "Bigs",
            list: bigs,
            field: "big_uniqname",
            asBig: false,
            replaceBig: true,
            Icon: ArrowUpLeft,
          },
          {
            title: "Littles",
            list: littles,
            field: "little_uniqname",
            asBig: true,
            replaceBig: false,
            Icon: ArrowDownLeft,
          },
        ].map(({ title, list, field, asBig, replaceBig, Icon }) => (
          <section key={title} className={styles.relationshipSection}>
            <div className={styles.sectionHeading}>
              <h3>
                <Icon size={15} />
                {title}
                <span>{list.length}</span>
              </h3>
              {canEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Add ${asBig ? "little" : "big"}`}
                  onClick={() => onAdd(asBig)}
                >
                  <Plus size={15} />
                </Button>
              )}
            </div>
            {list.length ? (
              <ul>
                {list.map((edge) => {
                  const relative = memberMap.get(edge[field]) || {
                    uniqname: edge[field],
                  };
                  return (
                    <li key={edge[field]} className={styles.relativeRow}>
                      <Button
                        variant="ghost"
                        className={styles.relativeLink}
                        onClick={() => onSelect(edge[field])}
                      >
                        <MemberAvatar
                          member={relative}
                          className={styles.relativeAvatar}
                        />
                        <span>
                          <strong>{relative.name || relative.uniqname}</strong>
                          <small>
                            {relative.current_class_number
                              ? `${relative.current_class_number} class`
                              : "Class not listed"}
                          </small>
                        </span>
                      </Button>
                      {canEdit && (
                        <div className={styles.relativeActions}>
                          <Button
                            className={styles.editRelationshipButton}
                            variant="ghost"
                            size="icon"
                            aria-label={`Replace ${replaceBig ? "big" : "little"} ${relative.name || relative.uniqname}`}
                            title={`Replace ${replaceBig ? "big" : "little"}`}
                            disabled={pending}
                            onClick={() => onEditRelationship(edge, replaceBig)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            className={styles.removeButton}
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove relationship with ${relative.name || relative.uniqname}`}
                            title="Remove relationship"
                            disabled={pending}
                            onClick={() => onRemove(edge)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={styles.emptyRelation}>
                No {title.toLowerCase()} added yet.
              </p>
            )}
          </section>
        ))}
      </div>
    </aside>
  );
}
