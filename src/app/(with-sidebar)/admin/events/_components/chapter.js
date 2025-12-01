"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SubmitButton from "@/app/components/submit-button";
import { handleEventSubmit } from "../_util/utils";

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const formSchema = z.object({
  name: z.string().min(1, "Required").transform((val) => {
    const month = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
    return `${month} Chapter`;
  }),
  event_date: z.date({ required_error: "Required" }),
  unexcused_absences: z.array(z.string().min(1)),
  excused_absences: z.array(z.string().min(1)),
});

export default function EditChapterEvent({ mode, initialData, members, id }) {
  const [dateOpen, setDateOpen] = useState(false);

  const initialUnexcusedAbsences = (() => {
    if (mode === "create") return [];
    const initialDataUniqnames = initialData?.event_attendance.map(mem => mem.uniqname);
    return members.map(mem => mem.uniqname).filter(mem => !initialDataUniqnames.includes(mem));
  })();

  const initialExcusedAbsences = (() => {
    if (mode === "create") return [];
    return initialData?.event_attendance.filter(attendee => attendee.attendance_status === "excused").map(absence => absence.uniqname);
  })();

  const [availableUnexcusedAbsences, setAvailableUnexcusedAbsences] = useState(
    members.filter(mem => !initialUnexcusedAbsences.includes(mem.uniqname))
  );
  const [selectedUnexcusedAbsences, setSelectedUnexcusedAbsences] = useState(
    members.filter(mem => initialUnexcusedAbsences.includes(mem.uniqname))
  );
  const [availableExcusedAbsences, setAvailableExcusedAbsences] = useState(
    members.filter(mem => !initialExcusedAbsences.includes(mem.uniqname))
  );
  const [selectedExcusedAbsences, setSelectedExcusedAbsences] = useState(
    members.filter(mem => initialExcusedAbsences.includes(mem.uniqname))
  );

  const form = useForm({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name.split(" ")[0].toLowerCase() ?? "",
      event_date: initialData?.event_date ? (() => {
        const [year, month, day] = initialData.event_date.split('-').map(Number);
        return new Date(year, month - 1, day);
      })() : undefined,
      excused_absences: initialExcusedAbsences,
      unexcused_absences: initialUnexcusedAbsences,
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
                <FormItem className="w-1/2">
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <SelectDate value={field.value} dateOpen={dateOpen} setDateOpen={setDateOpen} form={form} formItem="event_date" />
                  </FormControl>
                  <FormMessage className="flex-grow" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="w-1/2">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a month" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month} value={month.toLowerCase()}>
                            {month} Chapter
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <FormLabel>Excused Absences</FormLabel>
              <FormField
                control={form.control}
                name="excused_absences"
                render={({ field }) => (
                  <FormItem className="mb-8">
                    <FormControl>
                      <AttendanceDualListbox
                        allPeople={members}
                        availablePeople={availableExcusedAbsences}
                        setAvailablePeople={setAvailableExcusedAbsences}
                        selectedPeople={selectedExcusedAbsences}
                        setSelectedPeople={setSelectedExcusedAbsences}
                        disable={selectedUnexcusedAbsences}
                        form={form}
                        formItem="excused_absences"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col gap-1">
              <FormLabel>Unexcused Absences</FormLabel>
              <FormField
                control={form.control}
                name="unexcused_absences"
                render={({ field }) => (
                  <FormItem className="mb-8">
                    <FormControl>
                      <AttendanceDualListbox
                        allPeople={members}
                        availablePeople={availableUnexcusedAbsences}
                        setAvailablePeople={setAvailableUnexcusedAbsences}
                        selectedPeople={selectedUnexcusedAbsences}
                        setSelectedPeople={setSelectedUnexcusedAbsences}
                        disable={selectedExcusedAbsences}
                        form={form}
                        formItem="unexcused_absences"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
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