'use client'

import { useEffect, useState } from "react";
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
  AttendanceToggle,
  CreateEventButton,
  DeleteEvent,
  DeleteEventButton,
  SaveEventButton,
  SelectDate,
  SubmitCreate,
  SubmitEdit
} from "@/app/(with-sidebar)/admin/events/event-editor";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getMembers } from "./members-data";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(1, "Required"),
  event_date: z.date({ required_error: "Required"}),
  unexcused_absences: z.array(z.string().min(1)),
  excused_absences: z.array(z.string().min(1)),
});

export default function EditChapterEvent({ mode, initialData, id }) {
  if (mode === "edit" && !id) {
    return;
  }
  
  const router = useRouter();
  const [dateOpen, setDateOpen] = useState(false);
  const [membersData, setMembersData] = useState([]);
  const [membersDataLoading, setMembersDataLoading] = useState(true);
  const [selectedUnexcusedAbsence, setSelectedUnexcusedAbsence] = useState([]);
  const [selectedExcusedAbsence, setSelectedExcusedAbsence] = useState([]);

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
      unexcused_absences: initialData?.event_absences.filter(absence => absence.absence_type === "unexcused").map(absence => absence.uniqname) ?? [],
      excused_absences: initialData?.event_absences.filter(absence => absence.absence_type === "excused").map(absence => absence.uniqname) ?? [],
    },
  });

  useEffect(() => {
    getMembers().then((newMembersData) => {
      setMembersData(newMembersData);
      setMembersDataLoading(false);
    })
    setSelectedUnexcusedAbsence(form.getValues("unexcused_absences"));
    setSelectedExcusedAbsence(form.getValues("excused_absences"));
  }, [])

  const toggleUnexcusedAbsence = (member) => {
    const newSelectedUnexcusedAbsence = selectedUnexcusedAbsence.includes(member)
      ? selectedUnexcusedAbsence.filter((mem) => mem !== member)
      : [...selectedUnexcusedAbsence, member];
    setSelectedUnexcusedAbsence(newSelectedUnexcusedAbsence);
    form.setValue(`unexcused_absences`, newSelectedUnexcusedAbsence, {
      shouldValidate: false,
      shouldDirty: true,
    });
  }

  const toggleExcusedAbsence = (member) => {
    const newSelectedExcusedAbsence = selectedExcusedAbsence.includes(member)
      ? selectedExcusedAbsence.filter((mem) => mem !== member)
      : [...selectedExcusedAbsence, member];
    setSelectedExcusedAbsence(newSelectedExcusedAbsence);
    form.setValue(`excused_absences`, newSelectedExcusedAbsence, {
      shouldValidate: false,
      shouldDirty: true,
    });
  }

  async function onSubmit(values) {
    mode === "edit"
      ? SubmitEdit({ event_type: "chapter", values, id, router })
      : SubmitCreate({ event_type: "chapter", values, router })
  }

  async function onDelete() {
    DeleteEvent(id, router);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, (error) => console.log("Failed to submit:", error))}>
        <div className="flex flex-col gap-2">
          <div className="justify-between sm:justify-normal flex flex-row gap-2 sm:gap-16">
            <FormLabel className="w-1/2 sm:w-[300px]">Date</FormLabel>
            {form.getValues("event_date") && <FormLabel className="w-1/2 sm:w-auto">Name</FormLabel>}
          </div>
          <div className="flex flex-row gap-2 sm:gap-16 mb-8">
            <FormField
              control={form.control}
              name="event_date"
              render={({ field }) => (
                <FormItem className="w-1/2 sm:w-[300px] flex flex-col">
                  <FormControl>
                    <SelectDate value={field.value} dateOpen={dateOpen} setDateOpen={setDateOpen} form={form}/>
                  </FormControl>
                  <FormMessage className="flex-grow"/>
                </FormItem>
              )}
            />
            {form.getValues("event_date") &&
              (() => {
                const date = new Date(form.getValues("event_date"));
                const month = date.toLocaleString("default", { month: "long" });
                form.setValue("name", `${month} Chapter`);
                return (
                  <span 
                    className="w-1/2 sm:w-[200px] items-center border-input flex h-9 min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive">
                    {month} Chapter
                  </span>
                )
              })()
            }
          </div>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <FormLabel>Unexcused Absences</FormLabel>
              <FormField
                control={form.control}
                name="unexcused_absences"
                render={({ field }) => (
                  <FormItem className="w-full sm:w-[564px]">
                    <FormControl>
                      <AttendanceToggle
                        toggle={toggleUnexcusedAbsence}
                        people={membersData}
                        selectedPeople={selectedUnexcusedAbsence}
                        loading={membersDataLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <FormLabel>Excused Absences</FormLabel>
              <FormField
                control={form.control}
                name="excused_absences"
                render={({ field }) => (
                  <FormItem className="mb-8 w-full sm:w-[564px]">
                    <FormControl>
                      <AttendanceToggle
                        toggle={toggleExcusedAbsence}
                        people={membersData}
                        selectedPeople={selectedExcusedAbsence}
                        loading={membersDataLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="w-full sm:w-[564px] flex flex-row gap-4 justify-between">
            {mode === "edit"
              ? <SaveEventButton submitting={form.formState.isSubmitting}/>
              : <CreateEventButton submitting={form.formState.isSubmitting} />
            }
            {mode === "edit" &&
              <DeleteEventButton submitting={form.formState.isSubmitting} onDelete={onDelete}/>
            }
          </div>
        </div>
      </form>
    </Form>
  )
}