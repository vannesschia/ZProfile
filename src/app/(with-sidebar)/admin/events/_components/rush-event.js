"use client";

import { Input } from "@/components/ui/input";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  AttendanceDualListbox,
  DeleteEventButton,
  SelectDate,
} from "./event-editor";
import SubmitButton from "@/app/components/submit-button";
import { handleEventSubmit } from "../_util/utils";

const formSchema = z.object({
  name: z.string().min(1, "Required"),
  event_date: z.date({ required_error: "Required" }),
  attendance: z.array(z.string().min(1)),
});

export default function EditRushEvent({ mode, initialData, members, id }) {
  const [dateOpen, setDateOpen] = useState(false);

  const initialAttendance = (() => {
    if (mode === "create") return [];
    return initialData?.event_attendance.map(attendee => attendee.uniqname);
  })();

  const [availableMembers, setAvailableMembers] = useState(
    members.filter(mem => !initialAttendance.includes(mem.uniqname))
  );
  const [selectedMembers, setSelectedMembers] = useState(
    members.filter(mem => initialAttendance.includes(mem.uniqname))
  );

  const form = useForm({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      event_date: initialData?.event_date ? (() => {
        const [year, month, day] = initialData.event_date.split('-').map(Number);
        return new Date(year, month - 1, day);
      })() : undefined,
      attendance: initialAttendance,
    },
  });

  if (mode === "edit" && !id) {
    return;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleEventSubmit, (error) => console.log("Failed to submit:", error))}>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2 sm:gap-8 mb-8 items-start">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="w-1/2">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter a name"
                      type="text"
                      {...field}
                      className="text-sm w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="event_date"
              render={({ field }) => (
                <FormItem className="w-1/2">
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <SelectDate value={field.value} dateOpen={dateOpen} setDateOpen={setDateOpen} form={form} formItem="event_date" />
                  </FormControl>
                  <FormMessage className="flex-grow" />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col gap-1">
            <FormLabel>Attendance</FormLabel>
            <FormField
              control={form.control}
              name="attendance"
              render={({ field }) => (
                <FormItem className="mb-8">
                  <FormControl>
                    <AttendanceDualListbox
                      enableMoveAll
                      allPeople={members}
                      availablePeople={availableMembers}
                      setAvailablePeople={setAvailableMembers}
                      selectedPeople={selectedMembers}
                      setSelectedPeople={setSelectedMembers}
                      form={form}
                      formItem="attendance"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-row justify-between">
            {mode === "edit" ? (
              <>
                <SubmitButton submitting={form.formState.isSubmitting} text="Save" />
                <DeleteEventButton id={id} />
              </>
            ) : (
              <SubmitButton submitting={form.formState.isSubmitting} text="Create" />
            )}
          </div>
        </div>
      </form>
    </Form>
  )
}