"use client";

import { useState } from "react";
import { z } from "zod";
import {
  AttendanceDualListbox,
  DeleteEventButton,
  SelectDate,
} from "./event-editor";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import SubmitButton from "@/app/components/submit-button";
import { handleEventSubmit } from "../_util/utils";

const formSchema = z.object({
  name: z.string().min(1, "Required"),
  event_date: z.date({ required_error: "Required" }),
  unexcused_absences: z.array(z.string().min(1)),
  excused_absences: z.array(z.string().min(1)),
  attendance: z.array(z.string().min(1)),
});

export default function EditPledgeEvent({ mode, initialData, members, id }) {
  const [dateOpen, setDateOpen] = useState(false);

  const pledges = members.filter(mem => mem.role === "pledge").map(mem => mem.uniqname);

  const initialExcusedAbsences = (() => {
    if (mode === "create") return [];
    return initialData?.event_attendance.filter(attendee => attendee.attendance_status === "excused").map(absence => absence.uniqname);
  })();

  const initialUnexcusedAbsences = (() => {
    if (mode === "create") return [];
    const initialDataUniqnames = initialData?.event_attendance.map(mem => mem.uniqname);
    return pledges.filter(pledge => !initialDataUniqnames.includes(pledge));
  })();

  const initialAttendance = (() => {
    if (mode === "create") return [];
    return initialData?.event_attendance.map(mem => mem.uniqname).filter(mem => !pledges.includes(mem));
  })();

  const [availableBrotherAttendance, setAvailableBrotherAttendance] = useState(
    members.filter(mem => mem.role === "brother" && !initialAttendance.includes(mem.uniqname))
  );
  const [selectedBrotherAttendance, setSelectedBrotherAttendance] = useState(
    members.filter(mem => mem.role === "brother" && initialAttendance.includes(mem.uniqname))
  );
  const [availableUnexcusedAbsences, setAvailableUnexcusedAbsences] = useState(
    members.filter(mem => mem.role === "pledge" && !initialUnexcusedAbsences.includes(mem.uniqname))
  );
  const [selectedUnexcusedAbsences, setSelectedUnexcusedAbsences] = useState(
    members.filter(mem => mem.role === "pledge" && initialUnexcusedAbsences.includes(mem.uniqname))
  );
  const [availableExcusedAbsences, setAvailableExcusedAbsences] = useState(
    members.filter(mem => mem.role === "pledge" && !initialExcusedAbsences.includes(mem.uniqname))
  );
  const [selectedExcusedAbsences, setSelectedExcusedAbsences] = useState(
    members.filter(mem => mem.role === "pledge" && initialExcusedAbsences.includes(mem.uniqname))
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
      excused_absences: initialExcusedAbsences,
      unexcused_absences: initialUnexcusedAbsences,
      attendance: initialAttendance,
    },
  });

  if (mode === "edit" && !id) {
    return (
      <span>Failed to get event ID.</span>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleEventSubmit, (error) => console.log("Failed to submit:", error))}>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2 lg:gap-8 mb-8 items-start">
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
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <FormLabel>Pledge Excused Absences</FormLabel>
              <FormField
                control={form.control}
                name="excused_absences"
                render={({ field }) => (
                  <FormItem className="mb-8">
                    <FormControl>
                      <AttendanceDualListbox
                        allPeople={members.filter(mem => mem.role === "pledge")}
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
          </div>
          <div className="flex flex-col gap-1">
            <FormLabel>Pledge Unexcused Absences</FormLabel>
            <FormField
              control={form.control}
              name="unexcused_absences"
              render={({ field }) => (
                <FormItem className="mb-8">
                  <FormControl>
                    <AttendanceDualListbox
                      allPeople={members.filter(mem => mem.role === "pledge")}
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
          <div className="flex flex-col gap-1">
            <FormLabel>Brother Attendance</FormLabel>
            <FormField
              control={form.control}
              name="attendance"
              render={({ field }) => (
                <FormItem className="mb-8">
                  <FormControl>
                    <AttendanceDualListbox
                      allPeople={members.filter(mem => mem.role === "brother")}
                      availablePeople={availableBrotherAttendance}
                      setAvailablePeople={setAvailableBrotherAttendance}
                      selectedPeople={selectedBrotherAttendance}
                      setSelectedPeople={setSelectedBrotherAttendance}
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