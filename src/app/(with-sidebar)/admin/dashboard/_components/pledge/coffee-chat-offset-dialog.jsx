"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateCoffeeChatOffset } from "../../_lib/actions";

export function CoffeeChatOffsetDialog({ open, onOpenChange, pledge }) {
  const router = useRouter();
  const [offset, setOffset] = useState(
    pledge?.coffee_chat_offset !== undefined && pledge?.coffee_chat_offset !== null 
      ? pledge.coffee_chat_offset.toString() 
      : "0"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update offset when pledge changes or dialog opens
  useEffect(() => {
    if (open && pledge?.coffee_chat_offset !== undefined && pledge?.coffee_chat_offset !== null) {
      setOffset(pledge.coffee_chat_offset.toString());
    }
  }, [open, pledge?.coffee_chat_offset]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const offsetValue = parseInt(offset, 10);
      if (isNaN(offsetValue)) {
        toast.error("Please enter a valid number");
        setIsSubmitting(false);
        return;
      }

      const { error } = await updateCoffeeChatOffset(pledge.uniqname, offsetValue);

      if (error) {
        toast.error("Failed to update coffee chat requirement");
        console.error(error);
      } else {
        toast.success("Coffee chat requirement updated successfully");
        router.refresh();
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("An error occurred while updating");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdd = () => {
    const currentOffset = parseInt(offset, 10) || 0;
    setOffset((currentOffset + 1).toString());
  };

  const handleRemove = () => {
    const currentOffset = parseInt(offset, 10) || 0;
    setOffset(Math.max(0, currentOffset - 1).toString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw/6)] w-[calc(100vw/6)] min-w-[280px]">
        <DialogHeader>
          <DialogTitle>Manage Coffee Chat Requirement</DialogTitle>
          <DialogDescription>
            Adjust the coffee chat requirement for {pledge?.name || "this pledge"}. 
            The offset will be added to the base requirement.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="offset">Coffee Chat Offset</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRemove}
                  disabled={isSubmitting}
                >
                  -
                </Button>
                <Input
                  id="offset"
                  type="number"
                  value={offset}
                  onChange={(e) => setOffset(e.target.value)}
                  min="0"
                  className="text-center"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAdd}
                  disabled={isSubmitting}
                >
                  +
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Current offset: {offset}. This will be added to the base requirement.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
