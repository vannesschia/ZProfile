"use client";

import SubmitButton from "@/app/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Trash } from "lucide-react";
import { startTransition, useState } from "react";
import * as z from "zod";
import { useFieldArray, useForm } from "react-hook-form";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { addNewClass } from "./add-new-class";
import { getBrowserClient } from "@/lib/supbaseClient";
import { setRusheeToPledges } from "./_lib/queries";

export default function NewClassForm({prefill}) {

  const router = useRouter();
  const [footerHover, setFooterHover] = useState(true);

  const formSchema = z.object({
    members: z.array(
      z.object({
        name: z.string(),
        uniqname: z.string()
      })
    )
  });

  const membersDefault = prefill
    ? prefill.map((m) => ({ name: m.name ?? "", uniqname: m.uniqname ?? "" }))
    : Array(20).fill(null).map(() => ({ name: "", uniqname: "" }));

  const form = useForm({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    resolver: zodResolver(formSchema),
    defaultValues: { members: membersDefault },
  });

  const { control } = form;

  const { fields: pledges, append: addPledge, remove: removePledge } = useFieldArray({
    control,
    name: "members"
  });

  async function onSubmit(values) {
    const supabase = getBrowserClient()
    const error = prefill 
      ? await setRusheeToPledges(supabase) 
      : await addNewClass(values.members.filter(
          member => member.name !== "" && member.name !== ""
        ));
    console.log(error)

    if (error) {
      console.error("Failed to add new class.");
      toast.error("Failed to add new class.");
      return;
    }

    toast.success("New class added successfully!");
    startTransition(() => {
      router.replace("/admin/dashboard");
    });
  }

  const totalPledges = () => {
    return form.watch("members").filter(pledge => pledge.name !== "" && pledge.uniqname !== "").length;
  };

  return (
    <Form {...form} className="px-12">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="border rounded-md mb-8">
          <Table className="table-auto w-full">
            <TableHeader className="table-fixed w-full">
              <TableRow>
                <TableHead className="pl-3">Full Name</TableHead>
                <TableHead>Uniqname</TableHead>
                <TableHead className="w-9"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pledges.map((pledge, index) => (
                <TableRow key={pledge.id}>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`members.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              className="!bg-transparent shadow-none border-none focus-visible:ring-0 focus-visible:ring-transparent focus-visible:border-input !px-1"
                              placeholder="..."
                              type="text"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`members.${index}.uniqname`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              className="!bg-transparent shadow-none border-none focus-visible:ring-0 focus-visible:ring-transparent focus-visible:border-input !px-0"
                              placeholder="..."
                              type="text"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        removePledge(index)
                      }}
                      className="w-9 cursor-pointer"
                    >
                      <Trash />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className={`${footerHover ? "" : "!bg-transparent"}`}>
                <TableCell colSpan={3} className="relative">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      addPledge({ name: "", uniqname: "" });
                    }}
                    onMouseOver={() => setFooterHover(false)}
                    onMouseOut={() => setFooterHover(true)}
                    className="w-1/2 h-5 cursor-pointer absolute bottom-6.5 left-[50%] -translate-x-1/2"
                  >
                    <ChevronDown />
                  </Button>
                  Total: {totalPledges()}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        <SubmitButton submitting={form.formState.isSubmitting} disabled={totalPledges() === 0} />
      </form>
    </Form>
  )
};
