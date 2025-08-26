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
  AttendanceDualListbox,
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
  const [availableUnexcusedAbsences, setAvailableUnexcusedAbsences] = useState([]);
  const [selectedUnexcusedAbsences, setSelectedUnexcusedAbsences] = useState([]);
  const [availableExcusedAbsences, setAvailableExcusedAbsences] = useState([]);
  const [selectedExcusedAbsences, setSelectedExcusedAbsences] = useState([]);
  const [membersDataLoading, setMembersDataLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

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
      setAvailableUnexcusedAbsences(newMembersData.filter(mem => !form.getValues("unexcused_absences").includes(mem.uniqname)));
      setSelectedUnexcusedAbsences(newMembersData.filter(mem => form.getValues("unexcused_absences").includes(mem.uniqname)));
      setAvailableExcusedAbsences(newMembersData.filter(mem => !form.getValues("excused_absences").includes(mem.uniqname)))
      setSelectedExcusedAbsences(newMembersData.filter(mem => form.getValues("excused_absences").includes(mem.uniqname)));
      setMembersDataLoading(false);
    })
  }, []);

  async function onSubmit(values) {
    mode === "edit"
      ? SubmitEdit({ event_type: "chapter", values, id, router })
      : SubmitCreate({ event_type: "chapter", values, router })
  }

  async function onDelete() {
    setIsDeleting(true);
    DeleteEvent({id, router});
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, (error) => console.error("Failed to submit:", error))}>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2 lg:gap-8 mb-8 items-start">
            <FormField
              control={form.control}
              name="event_date"
              render={({ field }) => (
                <FormItem className={`${form.getValues("event_date") ? "w-1/2" : "w-[calc(50%-4px)] lg:w-[calc(50%-16px)]"}`}>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <SelectDate value={field.value} dateOpen={dateOpen} setDateOpen={setDateOpen} form={form} formItem="event_date"/>
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
                  <div className="w-1/2 flex flex-col gap-2">
                    <FormLabel>Name</FormLabel>
                    <span className="items-center border-input flex h-9 min-w-0 rounded-md border bg-transparent px-3 py-1 shadow-xs text-sm">
                      {month} Chapter
                    </span>
                  </div>
                )
              })()
            }
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
                  <SaveEventButton submitting={form.formState.isSubmitting}/>
                  <DeleteEventButton submitting={isDeleting} onDelete={onDelete}/>
                </>
              : <CreateEventButton submitting={form.formState.isSubmitting} />
            }
          </div>
        </div>
      </form>
    </Form>
  )
}