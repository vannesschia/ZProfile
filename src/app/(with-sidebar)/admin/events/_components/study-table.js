"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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

export default function EditStudyTableEvent({ mode, initialData, members, id }) {
  const [dateOpen, setDateOpen] = useState(false);

  const pledges = members.filter(mem => mem.role === "pledge").map(mem => mem.uniqname);

  const initialAttendance = (() => {
    if (mode === "create") return [];
    return initialData?.event_attendance.map(mem => mem.uniqname).filter(mem => !pledges.includes(mem));
  })();

  const [availableMembers, setAvailableMembers] = useState(
    members.filter(mem => mem.role === "pledge" && !initialAttendance.includes(mem.uniqname))
  );
  const [selectedMembers, setSelectedMembers] = useState(
    members.filter(mem => mem.role === "pledge" && initialAttendance.includes(mem.uniqname))
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
          <div className="flex flex-row gap-2 lg:gap-8 mb-8 items-start">
            <FormField
              control={form.control}
              name="event_date"
              render={({ field }) => (
                <FormItem className={`${form.getValues("event_date") ? "w-1/2" : "w-[calc(50%-4px)] lg:w-[calc(50%-16px)]"}`}>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <SelectDate value={field.value} dateOpen={dateOpen} setDateOpen={setDateOpen} form={form} formItem="event_date" />
                  </FormControl>
                  <FormMessage className="flex-grow" />
                </FormItem>
              )}
            />
            {form.getValues("event_date") &&
              (() => {
                const date = new Date(form.getValues("event_date"));
                const lastSunday = new Date(date.setDate(date.getDate() - (date.getDay() % 7))).toLocaleDateString();
                const nextSaturday = new Date(date.setDate(date.getDate() + ((date.getDay() + 6) % 7))).toLocaleDateString();
                form.setValue("name", `${lastSunday} - ${nextSaturday} Study Table`);
                return (
                  <div className="w-1/2 flex flex-col gap-2">
                    <FormLabel>Name</FormLabel>
                    <span className="items-center border-input flex min-w-0 rounded-md border dark:bg-input/30 !p-1 shadow-xs text-sm gap-2 leading-none h-9">
                      {lastSunday} - {nextSaturday} Study Table
                    </span>
                  </div>
                )
              })()
            }
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