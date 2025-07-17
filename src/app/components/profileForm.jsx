"use client";

import {
  useForm
} from "react-hook-form"
import { toast } from "sonner";
import {
  zodResolver
} from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Button
} from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { InputFile } from "@/app/components/PfpUpload"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";



const formSchema = z.object({
  name: z.string().min(1).transform((val) => val.trim()), //removes whitespace from name
  major: z.string().min(1),
  minor: z.string().min(1).optional(),
  grade: z.string().min(1),
  graduation_year: z.coerce.number().int().min(2020),
  current_class_number: z.string().min(1),  
  email_address: z.string().min(1),
  phone_number: z.string().min(1),
  // pronouns: z.string().min(1).optional(),
  // preferred_name: z.string().min(1).optional(),
  // profile_picture: z.string().min(1)
});

export function MyForm({ initialData, userEmail }) {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...initialData,
      name: initialData?.name || "",
      major: Array.isArray(initialData?.major)
        ? initialData.major.join(", ")
        : initialData?.major || "",
      minor: Array.isArray(initialData?.minor)
        ? initialData.minor.join(", ")
        : initialData?.minor || "",
      grade: initialData?.grade || "",
      graduation_year: initialData?.graduation_year?.toString() || "",
      current_class_number: initialData?.current_class_number || "",
      phone_number: initialData?.phone_number || "",
      email_address: initialData?.email_address || "",
    }
  });

  async function onSubmit(values) {
    const supabase = createClientComponentClient();

    const { email_address, major, minor, ...rest } = values;

    const payload = {
      ...rest,
      email_address: userEmail,
      major: [major],                 // wrap string as array
      minor: minor ? [minor] : [],    // wrap optional string as array
    };

    const { error, data } = await supabase
      .from("members")
      .update(payload)
      .eq("email_address", userEmail)
      .select();

      console.log("Update result:", { error, data });


    if (error) {
      console.error("Update error:", error.message);
      toast.error("Failed to update profile.");
    } else {
      toast.success("Profile updated successfully!");
      form.reset(payload); // optional: reset to new values
      router.refresh();     // refresh the page (optional)
      setTimeout(() => {
        router.push("/profile"); // ✅ redirect to profile page
      }, 1000); // wait for toast to be readable before redirecting
    }
    console.log("Submitting payload:", payload);

  }

  return (
    <Form {...form} className="px-12">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
        {/* Full name - full width */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input 
                placeholder=""
                type="text"
                {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Two column grid for remaining fields */}
        <div className="grid grid-cols-2 gap-8">
          {/* Left column */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="major"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Major</FormLabel>
                  <FormControl>
                    <Input 
                    placeholder=""
                    type="text"
                    {...field} />
                  </FormControl>
                  {/* <FormDescription>enter your major(s)</FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="graduation_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Graduation Date</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="select graduation semester" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* <SelectItem value="F2025">F25</SelectItem>
                      <SelectItem value="W2026">W26</SelectItem>
                      <SelectItem value="F2026">F26</SelectItem>
                      <SelectItem value="W2027">W27</SelectItem>
                      <SelectItem value="F2027">F27</SelectItem>
                      <SelectItem value="W2028">W28</SelectItem>
                      <SelectItem value="F2028">F28</SelectItem>
                      <SelectItem value="W2029">W29</SelectItem>
                      <SelectItem value="F2029">F29</SelectItem> */}
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                      <SelectItem value="2028">2028</SelectItem>
                      <SelectItem value="2029">2029</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* <FormField
              control={form.control}
              name="email_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                    placeholder="------@umich.edu"
                    type="email"
                    {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                    placeholder="(xxx) xxx-xxxx"
                    type="tel"
                    {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="minor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minor</FormLabel>
                  <FormControl>
                    <Input 
                    placeholder=""
                    type="text"
                    {...field} />
                  </FormControl>
                  {/* <FormDescription>enter your minor(s)</FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade</FormLabel>
                  <FormControl>
                    <Input 
                    placeholder=""
                    type="text"
                    {...field} />
                  </FormControl>
                  {/* <FormDescription>enter your class</FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="current_class_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="select class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Beta">Beta</SelectItem>
                      <SelectItem value="Gamma">Gamma</SelectItem>
                      <SelectItem value="Delta">Delta</SelectItem>
                      <SelectItem value="Epsilon">Epsilon</SelectItem>
                      <SelectItem value="Zeta">Zeta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            
          </div>
        </div>
        {/* <InputFile /> */}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Submit"}
        </Button>      
      </form>
    </Form>
  )
}