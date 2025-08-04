'use client'

import { useEffect, useState } from "react";
import { z } from "zod";
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
  if (mode === "edit" && !id) {
    return;
  }

  const router = useRouter();
  const [dateOpen, setDateOpen] = useState(false);
  const [membersData, setMembersData] = useState([]);
  const [membersDataLoading, setMembersDataLoading] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedUnexcusedAbsence, setSelectedUnexcusedAbsence] = useState([]);
  const [selectedExcusedAbsence, setSelectedExcusedAbsence] = useState([]);

  useEffect(() => {
    getMembers().then((newMembersData) => {
      setMembersData(newMembersData);
      setMembersDataLoading(false);
    })
    setSelectedMembers(form.getValues("attendance"));
    setSelectedUnexcusedAbsence(form.getValues("unexcused_absences"));
    setSelectedExcusedAbsence(form.getValues("excused_absences"));
  }, [])

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

  const toggleMember = (member) => {
    const newSelectedMembers = selectedMembers.includes(member)
      ? selectedMembers.filter((mem) => mem !== member)
      : [...selectedMembers, member];
    setSelectedMembers(newSelectedMembers);
    form.setValue(`attendance`, newSelectedMembers, {
      shouldValidate: false,
      shouldDirty: true,
    });
  }

  const toggleUnexcusedAbsence = (pledge) => {
    const newSelectedUnexcusedAbsence = selectedUnexcusedAbsence.includes(pledge)
      ? selectedUnexcusedAbsence.filter((mem) => mem !== pledge)
      : [...selectedUnexcusedAbsence, pledge];
    setSelectedUnexcusedAbsence(newSelectedUnexcusedAbsence);
    form.setValue(`unexcused_absences`, newSelectedUnexcusedAbsence, {
      shouldValidate: false,
      shouldDirty: true,
    });
  }

  const toggleExcusedAbsence = (pledge) => {
    const newSelectedExcusedAbsence = selectedExcusedAbsence.includes(pledge)
      ? selectedExcusedAbsence.filter((mem) => mem !== pledge)
      : [...selectedExcusedAbsence, pledge];
    setSelectedExcusedAbsence(newSelectedExcusedAbsence);
    form.setValue(`excused_absences`, newSelectedExcusedAbsence, {
      shouldValidate: false,
      shouldDirty: true,
    });
  }

  async function onSubmit(values) {
    mode === "edit"
      ? SubmitEdit({ event_type: "pledge_event", values, id, router })
      : SubmitCreate({ event_type: "pledge_event", values, router })
  }

  async function onDelete() {
    DeleteEvent(id, router);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, (error) => console.log("Failed to submit:", error))}>
        <div className="flex flex-col gap-2">
          <div className="justify-between sm:justify-normal flex flex-row gap-2 sm:gap-16">
            <FormLabel className="w-1/2 sm:w-[300px]">Name</FormLabel>
            <FormLabel className="w-1/2 sm:w-auto">Date</FormLabel>
          </div>
          <div className="flex flex-row gap-2 sm:gap-16 mb-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="w-1/2 sm:w-[300px]">
                  <FormControl>
                    <Input
                      placeholder="Enter a name"
                      type="text"
                      {...field}
                      className="text-sm w-1/2 w-full"
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
                <FormItem className="w-1/2 sm:w-[200px] flex flex-col">
                  <FormControl>
                    <SelectDate value={field.value} dateOpen={dateOpen} setDateOpen={setDateOpen} form={form}/>
                  </FormControl>
                  <FormMessage className="flex-grow"/>
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <FormLabel>Pledge Unexcused Absences</FormLabel>
              <FormField
                control={form.control}
                name="unexcused_absences"
                render={({ field }) => (
                  <FormItem className="w-full sm:w-[564px]">
                    <FormControl>
                      <AttendanceToggle
                        toggle={toggleUnexcusedAbsence}
                        people={membersData.filter(member => member.role === "pledge")}
                        selectedPeople={selectedUnexcusedAbsence}
                        loading={membersDataLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <FormLabel>Pledge Excused Absences</FormLabel>
              <FormField
                control={form.control}
                name="excused_absences"
                render={({ field }) => (
                  <FormItem className="mb-8 w-full sm:w-[564px]">
                    <FormControl>
                      <AttendanceToggle
                        toggle={toggleExcusedAbsence}
                        people={membersData.filter(member => member.role === "pledge")}
                        selectedPeople={selectedUnexcusedAbsence}
                        loading={membersDataLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-[564px]">
            <FormLabel>Brother Attendance</FormLabel>
            <FormField
              control={form.control}
              name="attendance"
              render={({ field }) => (
                <FormItem className="mb-8">
                  <FormControl>
                    <AttendanceToggle
                      toggle={toggleMember}
                      people={membersData.filter(member => member.role === "brother")}
                      selectedPeople={selectedUnexcusedAbsence}
                      loading={membersDataLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
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