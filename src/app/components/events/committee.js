'use client'

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect, useState } from "react";
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
  CreateEventButton,
  DeleteEvent,
  DeleteEventButton,
  SaveEventButton,
  SelectDate,
  SubmitCreate,
  SubmitEdit
} from "@/app/(with-sidebar)/admin/events/event-editor";
import { getMembers } from "./members-data";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(1, "Required"),
  committee: z.string().min(1, "Required"),
  event_date: z.date({ required_error: "Required"}),
  attendance: z.array(z.string().min(1)),
});

export default function EditCommitteeEvent({ mode, initialData, id }) {
  const router = useRouter();
  const [dateOpen, setDateOpen] = useState(false);
  const [membersData, setMembersData] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [membersDataLoading, setMembersDataLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    getMembers().then((newMembersData) => {
      setMembersData(newMembersData);
      setAvailableMembers(newMembersData.filter(mem => !form.getValues("attendance").includes(mem.uniqname)));
      setSelectedMembers(newMembersData.filter(mem => form.getValues("attendance").includes(mem.uniqname)));
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
      committee: initialData?.committee ?? "",
      attendance: initialData?.event_attendance.map(attendee => attendee.uniqname) ?? [],
    },
  });

  if (mode === "edit" && !id) {
    return;
  }
  
  const committeeOptions = [
    { name: "technology", label: "Technology" },
    { name: "prof_dev", label: "Professional Development" },
    { name: "ram", label: "Recruitment & Membership" },
    { name: "social", label: "Social" },
    { name: "marketing", label: "Marketing" },
    { name: "fundraising", label: "Fundraising" },
  ];

  async function onSubmit(values) {
    mode === "edit"
      ? await SubmitEdit({ event_type: "committee", values, id, router })
      : await SubmitCreate({ event_type: "committee", values, router })
  }

  async function onDelete() {
    setIsDeleting(true);
    await DeleteEvent({id, router});
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
          <FormField
            control={form.control}
            name="committee"
            render={({ field }) => (
              <FormItem className="mb-8">
                <FormLabel>Committee</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="cursor-pointer hover:text-accent-foreground w-full lg:w-[calc(50%-16px)]">
                      <SelectValue placeholder="Select a committee"></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {committeeOptions.map((com) => (
                        <SelectItem
                          key={com.name}
                          value={com.name}
                        >
                          {com.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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