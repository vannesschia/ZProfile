"use client";

import { startTransition } from "react";
import { submitEventCreate, submitEventEdit } from "../_lib/actions";
import { toast } from "sonner";

export async function handleEventSubmit(values) {
  try {
    if (mode === "edit") {
      await submitEventEdit({ event_type: "pledge_event", values, id });
    } else {
      await submitEventCreate({ event_type: "pledge_event", values });
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