'use client'

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
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
  Input
} from "@/components/ui/input"
import { SelectDate } from "../events/event-editor";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";

const formSchema = z.object({
  pledge_committee_pts_req: z.preprocess((val) => (val === "" || val === null || val === undefined ? undefined : Number(val)), z.number().min(0)),
  brother_committee_pts_req: z.preprocess((val) => (val === "" || val === null || val === undefined ? undefined : Number(val)), z.number().min(0)),
  senior_committee_pts_req: z.preprocess((val) => (val === "" || val === null || val === undefined ? undefined : Number(val)), z.number().min(0)),
  first_milestone_cc: z.preprocess((val) => (val === "" || val === null || val === undefined ? undefined : Number(val)), z.number().min(0)),
  first_milestone_cp: z.preprocess((val) => (val === "" || val === null || val === undefined ? undefined : Number(val)), z.number().min(0)),
  second_milestone_cc: z.preprocess((val) => (val === "" || val === null || val === undefined ? undefined : Number(val)), z.number().min(0)),
  second_milestone_cp: z.preprocess((val) => (val === "" || val === null || val === undefined ? undefined : Number(val)), z.number().min(0)),
  final_milestone_cc: z.preprocess((val) => (val === "" || val === null || val === undefined ? undefined : Number(val)), z.number().min(0)),
  final_milestone_cp: z.preprocess((val) => (val === "" || val === null || val === undefined ? undefined : Number(val)), z.number().min(0)),
  first_milestone_due_date: z.date(),
  second_milestone_due_date: z.date(),
  final_milestone_due_date: z.date(),
  semester_last_day: z.date(),
  pledge_multiplier: z.preprocess((val) => (val === "" || val === null || val === undefined ? undefined : Number(val)), z.number().min(0)),
  brother_multiplier: z.preprocess((val) => (val === "" || val === null || val === undefined ? undefined : Number(val)), z.number().min(0)),
});

export function RequirementsForm({ initialData }) {
  const router = useRouter();

  const form = useForm({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...initialData,
      first_milestone_due_date: initialData?.first_milestone_due_date ? (() => {
        const [year, month, day] = initialData.first_milestone_due_date.split('-').map(Number);
        return new Date(year, month - 1, day);
      })() : undefined,
      second_milestone_due_date: initialData?.second_milestone_due_date ? (() => {
        const [year, month, day] = initialData.second_milestone_due_date.split('-').map(Number);
        return new Date(year, month - 1, day);
      })() : undefined,
      final_milestone_due_date: initialData?.second_milestone_due_date ? (() => {
        const [year, month, day] = initialData.second_milestone_due_date.split('-').map(Number);
        return new Date(year, month - 1, day);
      })() : undefined,
      semester_last_day: initialData?.semester_last_day ? (() => {
        const [year, month, day] = initialData.semester_last_day.split('-').map(Number);
        return new Date(year, month - 1, day);
      })() : undefined,
    }
  });

  const [dateOpenArray, setDateOpenArray] = useState([false, false, false, false]);

  async function onSubmit(values) {
    const supabase = createClientComponentClient();

    const { error } = await supabase
      .from('requirements')
      .update(values)
      .eq('id', true)

    if (error) {
      console.error("Update error:", error.message)
      toast.error("Failed to update requirements.");
      return;
    }

    toast.success("Requirements updated successfully!");
    setTimeout(() => {
      router.push("/requirements");
    }, 1000);
  }

  return (
    <Form {...form} >
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-8 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start w-2/3">
            <FormField
              control={form.control}
              name="pledge_committee_pts_req"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Pledge Committee Points Requirement</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brother_committee_pts_req"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Brother Committee Points Requirement</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="senior_committee_pts_req"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Senior Committee Points Requirement</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start w-2/3">
            <FormField
              control={form.control}
              name="first_milestone_cc"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>First Milestone Coffee Chats</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="second_milestone_cc"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Second Milestone Coffee Chats</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="final_milestone_cc"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Final Milestone Coffee Chats</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start w-2/3">
            <FormField
              control={form.control}
              name="first_milestone_cp"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>First Milestone Committee Points</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="second_milestone_cp"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Second Milestone Committee Points</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="final_milestone_cp"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Final Milestone Committee Points</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start w-2/3">
            <FormField
              control={form.control}
              name="first_milestone_due_date"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>First Milestone Due Date</FormLabel>
                  <FormControl>
                    <SelectDate
                      dateOpen={dateOpenArray[0]}
                      setDateOpen={(prevOpen) =>
                        setDateOpenArray(prev => {
                          const newDateOpen = [...prev];
                          newDateOpen[0] = prevOpen;
                          return newDateOpen;
                        })
                      }
                      value={field.value}
                      form={form}
                      formItem="first_milestone_due_date"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="second_milestone_due_date"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Second Milestone Due Date</FormLabel>
                  <FormControl>
                    <SelectDate
                      dateOpen={dateOpenArray[1]}
                      setDateOpen={(prevOpen) =>
                        setDateOpenArray(prev => {
                          const newDateOpen = [...prev];
                          newDateOpen[1] = prevOpen;
                          return newDateOpen;
                        })
                      }
                      value={field.value}
                      form={form}
                      formItem="second_milestone_due_date"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="final_milestone_due_date"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Final Milestone Due Date</FormLabel>
                  <FormControl>
                    <SelectDate
                      dateOpen={dateOpenArray[2]}
                      setDateOpen={(prevOpen) =>
                        setDateOpenArray(prev => {
                          const newDateOpen = [...prev];
                          newDateOpen[2] = prevOpen;
                          return newDateOpen;
                        })
                      }
                      value={field.value}
                      form={form}
                      formItem="final_milestone_due_date"/>
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start w-2/3">
            <FormField
              control={form.control}
              name="semester_last_day"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Semester Last Day</FormLabel>
                  <FormControl>
                    <SelectDate
                      dateOpen={dateOpenArray[3]}
                      setDateOpen={(prevOpen) =>
                        setDateOpenArray(prev => {
                          const newDateOpen = [...prev];
                          newDateOpen[3] = prevOpen;
                          return newDateOpen;
                        })
                      }
                      value={field.value}
                      form={form}
                      formItem="semester_last_day"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pledge_multiplier"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Pledge Multiplier</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brother_multiplier"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Brother Multiplier</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button className="cursor-pointer" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Submit"}
        </Button>
      </form>
    </Form>
  )
}