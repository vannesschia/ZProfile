'use client'

import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";
import handleIssuePost from "./issues-api";

const formSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

export default function BugReportForm() {
  const form = useForm({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  async function onSubmit(values) {
    const { title, description } = values;
    await handleIssuePost(title, description);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Briefly describe the bug"
                    type="text"
                    {...field}
                    className="text-sm w-full lg:w-1/2"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Steps</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Steps to reproduce"
                    type="text"
                    {...field}
                    className="text-sm w-full lg:w-1/2"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          {form.formState.isSubmitting
            ? <Button disabled className="w-[100px]">
                <Loader2Icon className="animate-spin" />
                Submitting
              </Button>
            : <Button className="cursor-pointer w-[100px]" type="submit">Submit</Button>
          }
        </div>
      </form>
    </Form>
  )
}