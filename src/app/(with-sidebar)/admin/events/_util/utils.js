"use client";

import { startTransition } from "react";
import { submitEventCreate, submitEventEdit } from "../_lib/actions";
import { toast } from "sonner";

export async function handleEventSubmit(values, mode, id, router, event_type) {
  try {
    if (mode === "edit") {
      await submitEventEdit({ event_type, values, id });
    } else {
      await submitEventCreate({ event_type, values });
    }

    toast.success(`Event ${mode === "edit" ? "saved" : "created"} successfully!`);

    startTransition(() => {
      router.push("/admin/dashboard?tab=events");
    });
  } catch (error) {
    console.error(error);
    toast.error(`Failed to ${mode === "edit" ? "save" : "create"} event.`);
  }
}