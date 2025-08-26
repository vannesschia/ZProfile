'use client'

import { useEffect, useState } from "react";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { getMembers } from "./members-data";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(1, "Required"),
  event_date: z.date({ required_error: "Required"}),
  unexcused_absences: z.array(z.string().min(1)),
  excused_absences: z.array(z.string().min(1)),
  attendance: z.array(z.string().min(1)),
});

export default function EditPledgeEvent({ mode, initialData, id }) {
  const router = useRouter();
  const [dateOpen, setDateOpen] = useState(false);
  const [membersData, setMembersData] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [availableUnexcusedAbsences, setAvailableUnexcusedAbsences] = useState([]);
  const [selectedUnexcusedAbsences, setSelectedUnexcusedAbsences] = useState([]);
  const [availableExcusedAbsences, setAvailableExcusedAbsences] = useState([]);
  const [selectedExcusedAbsences, setSelectedExcusedAbsences] = useState([]);
  const [membersDataLoading, setMembersDataLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    getMembers().then((newMembersData) => {
      setMembersData(newMembersData);
      setAvailableMembers(newMembersData.filter(mem => !form.getValues("attendance").includes(mem.uniqname)));
      setSelectedMembers(newMembersData.filter(mem => form.getValues("attendance").includes(mem.uniqname)));
      setAvailableUnexcusedAbsences(newMembersData.filter(mem => mem.role === "pledge" && !form.getValues("unexcused_absences").includes(mem.uniqname)));
      setSelectedUnexcusedAbsences(newMembersData.filter(mem => mem.role === "pledge" && form.getValues("unexcused_absences").includes(mem.uniqname)));
      setAvailableExcusedAbsences(newMembersData.filter(mem => mem.role === "pledge" && !form.getValues("excused_absences").includes(mem.uniqname)))
      setSelectedExcusedAbsences(newMembersData.filter(mem => mem.role === "pledge" && form.getValues("excused_absences").includes(mem.uniqname)));
      setMembersDataLoading(false);
    })
  }, []);

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
      unexcused_absences: initialData?.event_absences.filter((absence) => absence.absence_type === "unexcused").map(absence => absence.uniqname) ?? [],
      excused_absences: initialData?.event_absences.filter((absence) => absence.absence_type === "excused").map(absence => absence.uniqname) ?? [],
      attendance: initialData?.event_attendance.map(attendee => attendee.uniqname) ?? [],
    },
  });

  if (mode === "edit" && !id) {
    return;
  }

  async function onSubmit(values) {
    mode === "edit"
      ? SubmitEdit({ event_type: "pledge_event", values, id, router })
      : SubmitCreate({ event_type: "pledge_event", values, router })
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
                    <SelectDate value={field.value} dateOpen={dateOpen} setDateOpen={setDateOpen} form={form} formItem="event_date"/>
                  </FormControl>
                  <FormMessage className="flex-grow"/>
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
                        allPeople={membersData.filter(mem => mem.role === "pledge")}
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
                      allPeople={membersData.filter(mem => mem.role === "pledge")}
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
          <div className="flex flex-col gap-1">
            <FormLabel>Brother Attendance</FormLabel>
            <FormField
              control={form.control}
              name="attendance"
              render={({ field }) => (
                <FormItem className="mb-8">
                  <FormControl>
                    <AttendanceDualListbox
                      allPeople={membersData}
                      availablePeople={availableMembers}
                      setAvailablePeople={setAvailableMembers}
                      selectedPeople={selectedMembers}
                      setSelectedPeople={setSelectedMembers}
                      form={form}
                      formItem="attendance"
                      loading={membersDataLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
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