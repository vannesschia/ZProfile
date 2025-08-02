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
  AttendanceToggle,
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
  if (mode === "edit" && !id) {
    return;
  }
  
  const router = useRouter();
  const [dateOpen, setDateOpen] = useState(false);
  const committeeOptions = [
    { name: "technology", label: "Technology" },
    { name: "prof_dev", label: "Professional Development" },
    { name: "ram", label: "Recruitment & Membership" },
    { name: "social", label: "Social" },
    { name: "marketing", label: "Marketing" },
    { name: "fundraising", label: "Fundraising" },
  ];
  const [membersData, setMembersData] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    getMembers().then((newMembersData) => {
      setMembersData(newMembersData);
    })
    setSelectedMembers(form.getValues("attendance"));
  }, [])

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

  const toggleAllMembers = () => {
    const newSelectedMembers = [];
    if (selectedMembers.length === membersData.length) {
      setSelectedMembers(newSelectedMembers);
    } else {
      for (const { uniqname } of membersData) {
        newSelectedMembers.push(uniqname);
      }
      setSelectedMembers(newSelectedMembers);
    }
    form.setValue(`attendance`, newSelectedMembers, {
      shouldValidate: false,
      shouldDirty: true,
    });
  }

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

  async function onSubmit(values) {
    mode === "edit"
      ? SubmitEdit({ event_type: "committee", values, id, router })
      : SubmitCreate({ event_type: "committee", values, router })
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
          <div className="justify-between flex flex-row gap-2 sm:gap-16 mb-8 sm:w-[564px]">
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
                <FormItem className="w-1/2 sm:w-[200px] flex flex-col">
                  <FormControl>
                    <SelectDate value={field.value} dateOpen={dateOpen} setDateOpen={setDateOpen} form={form}/>
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
                    <SelectTrigger className="w-full sm:w-[300px]">
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
          <div className="flex flex-col gap-2 w-full sm:w-[564px]">
            <FormLabel>Attendance</FormLabel>
            <FormField
              control={form.control}
              name="attendance"
              render={({ field }) => (
                <FormItem className="mb-8">
                  <FormControl>
                    <AttendanceToggle selectAll toggleAll={toggleAllMembers} toggle={toggleMember} people={membersData} selectedPeople={selectedMembers} />
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