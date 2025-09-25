'use client'

import { useEffect, useState } from "react";
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
  DeleteEvent,
  DeleteEventButton,
  SelectDate,
  SubmitCreate,
  SubmitEdit
} from "@/app/(with-sidebar)/admin/events/event-editor";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getMembers } from "./members-data";
import { useRouter } from "next/navigation";
import SubmitButton from "../submit-button";

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

export default function EditChapterEvent({ mode, initialData, id }) {
  const router = useRouter();
  const [dateOpen, setDateOpen] = useState(false);
  const [membersData, setMembersData] = useState([]);
  const [availableUnexcusedAbsences, setAvailableUnexcusedAbsences] = useState([]);
  const [selectedUnexcusedAbsences, setSelectedUnexcusedAbsences] = useState([]);
  const [availableExcusedAbsences, setAvailableExcusedAbsences] = useState([]);
  const [selectedExcusedAbsences, setSelectedExcusedAbsences] = useState([]);
  const [membersDataLoading, setMembersDataLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getMembers().then((newMembersData) => {
      setMembersData(newMembersData);
      setAvailableUnexcusedAbsences(newMembersData.filter(mem => !form.getValues("unexcused_absences").includes(mem.uniqname)));
      setSelectedUnexcusedAbsences(newMembersData.filter(mem => form.getValues("unexcused_absences").includes(mem.uniqname)));
      setAvailableExcusedAbsences(newMembersData.filter(mem => !form.getValues("excused_absences").includes(mem.uniqname)))
      setSelectedExcusedAbsences(newMembersData.filter(mem => form.getValues("excused_absences").includes(mem.uniqname)));
      setMembersDataLoading(false);
    })
  }, []);

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
      unexcused_absences: initialData?.event_absences.filter(absence => absence.absence_type === "unexcused").map(absence => absence.uniqname) ?? [],
      excused_absences: initialData?.event_absences.filter(absence => absence.absence_type === "excused").map(absence => absence.uniqname) ?? [],
    },
  });

  if (mode === "edit" && !id) {
    return;
  }

  async function onSubmit(values) {
    mode === "edit"
      ? SubmitEdit({ event_type: "chapter", values, id, router })
      : SubmitCreate({ event_type: "chapter", values, router })
  }

  async function onDelete() {
    setIsDeleting(true);
    DeleteEvent({ id, router });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, (error) => console.log("Failed to submit:", error))}>
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
                        allPeople={membersData}
                        availablePeople={availableExcusedAbsences}
                        setAvailablePeople={setAvailableExcusedAbsences}
                        selectedPeople={selectedExcusedAbsences}
                        setSelectedPeople={setSelectedExcusedAbsences}
                        disable={selectedUnexcusedAbsences}
                        form={form}
                        formItem="excused_absences"
                        loading={membersDataLoading}
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
                        allPeople={membersData}
                        availablePeople={availableUnexcusedAbsences}
                        setAvailablePeople={setAvailableUnexcusedAbsences}
                        selectedPeople={selectedUnexcusedAbsences}
                        setSelectedPeople={setSelectedUnexcusedAbsences}
                        disable={selectedExcusedAbsences}
                        form={form}
                        formItem="unexcused_absences"
                        loading={membersDataLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="flex flex-row justify-between">
            {mode === "edit"
              ? <>
                <SubmitButton submitting={form.formState.isSubmitting} text="Save" />
                <DeleteEventButton submitting={isDeleting} onDelete={onDelete} />
              </>
              : <SubmitButton submitting={form.formState.isSubmitting} text="Create" />
            }
          </div>
        </div>
      </form>
    </Form>
  )
}