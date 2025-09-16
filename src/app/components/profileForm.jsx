"use client";

import { useForm, useFieldArray } from "react-hook-form"
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
import { useRouter } from "next/navigation";
import { Trash, ListPlus, Loader2Icon } from "lucide-react";
import { wordsToTermCode, isValidTerm } from "../(with-sidebar)/course-directory/term-functions";
import { useEffect, useRef, useState } from "react";
import MultiSelect from "./multiselect";
import handleCourseSearch from "./classes-api";
import { getBrowserClient } from "@/lib/supbaseClient";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import PhoneNumberInput from "./phone-number/phone-number";
import Image from "next/image";

const formSchema = z.object({
  name: z.string().min(1, "Please enter your name").transform((val) => val.trim()), //removes whitespace from name
  major: z.string().min(1, "Please enter your major"),
  minor: z.string().optional(),
  grade: z.string().min(1, "Please enter your grade"),
  graduation_year: z.coerce.number().int().min(2020, "Please enter your graduation year"),
  current_class_number: z.string().min(1, "Please enter your class"),
  email_address: z.string().min(1, "Please enter your email address"),
  phone_number: z.string().length(10, "Invalid phone number"),
  courses: z.array(
    z.object({
      term: z.string().min(1, "Invalid term format"),
      classes: z.array(z.string()).min(1, "Term must contain at least one course")
    })
  )
});

export function MyForm({ initialData, userEmail }) {
  const router = useRouter();
  const supabase = getBrowserClient();

  // Separate state for profile picture upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(initialData?.profile_picture_url || null);

  const form = useForm({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
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
      email_address: initialData?.email_address || "",
      phone_number: initialData?.phone_number || "",
      courses: initialData?.brother_classes || [],
    }
  });

  const { control } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "courses"
  });

  async function uploadSelectedImage() {
    if (!selectedFile) return null;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, or WebP).");
      throw new Error("Invalid image type");
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB.");
      throw new Error("Image too large");
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("Auth error:", userError);
      throw new Error(`Authentication error: ${userError.message}`);
    }
    if (!user) {
      throw new Error("You must be logged in to upload images.");
    }

    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `profile-pictures/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-pictures")
      .upload(filePath, selectedFile, {
        cacheControl: '3600',
        upsert: false
      });
    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(uploadError.message || "Failed to upload image.");
    }

    const { data: publicData } = supabase.storage
      .from("profile-pictures")
      .getPublicUrl(filePath);
    return { imageUrl: publicData.publicUrl, storageKey: filePath };
  }

  const termInputDebounce = useRef({});
  const courseSearchDebounce = useRef({});
  const [searchText, setSearchText] = useState({});
  const [courseOptions, setCourseOptions] = useState({});
  const [termValidity, setTermValidity] = useState({});

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        name: initialData.name || "",
        major: Array.isArray(initialData.major) ? initialData.major.join(", ") : initialData.major || "",
        minor: Array.isArray(initialData.minor) ? initialData.minor.join(", ") : initialData.minor || "",
        grade: initialData.grade || "",
        graduation_year: initialData.graduation_year?.toString() || "",
        current_class_number: initialData.current_class_number || "",
        email_address: initialData.email_address || "",
        phone_number: initialData.phone_number || "",
        courses: initialData.brother_classes || [],
      });
    }
    const newTermValidity = {};
    if (initialData?.brother_classes) {
      initialData.brother_classes.forEach((_, index) => {
        newTermValidity[index] = true;
      });
    }
    setTermValidity(newTermValidity);
  }, [initialData, form]);

  async function onSubmit(values) {
    const supabase = createClientComponentClient();

    const { email_address, major, minor, courses, ...rest } = values;

    const uniqname = userEmail.split("@")[0];

    // Require a profile picture: either an existing image or a newly selected file
    if (!currentImageUrl && !selectedFile) {
      form.setError("root", {
        type: "manual",
        message: "Please upload a profile picture.",
      });
      toast.error("Please upload a profile picture.");
      return;
    }

    let uploaded = null;
    let previousStorageKey = null;
    if (currentImageUrl) {
      const oldFileName = currentImageUrl.split('/').pop();
      if (oldFileName) previousStorageKey = `profile-pictures/${oldFileName}`;
    }
    if (selectedFile) {
      try {
        uploaded = await uploadSelectedImage();
      } catch (e) {
        console.error("Image upload error:", e);
        toast.error(e.message || "Failed to upload image.");
        return;
      }
    }

    const payload = {
      ...rest,
      email_address: userEmail,
      uniqname,
      major: [major],
      minor: minor ? [minor] : [],
      onboarding_completed: true,
      ...(uploaded?.imageUrl ? { profile_picture_url: uploaded.imageUrl } : {})
    };

    const { error: membersError } = await supabase
      .from("members")
      .upsert(payload, { onConflict: 'email_address' })

    if (membersError) {
      console.error("Update error:", membersError.message);
      toast.error("Failed to update profile.");
      if (uploaded?.storageKey) {
        try {
          await getBrowserClient().storage.from("profile-pictures").remove([uploaded.storageKey]);
        } catch { }
      }
      return;
    }
    const allCourses = new Set();

    const newCourses = courses.flatMap((course) => {
      return course.classes.map((clas) => {
        const [subjectCode = "", catalogNumber = ""] = clas.trim().toUpperCase().split(" ", 2);
        const class_name = subjectCode + catalogNumber;
        const term_code = wordsToTermCode(course.term);
        const linked_at = new Date().toISOString();
        allCourses.add(class_name);
        return {
          uniqname,
          class_name,
          term_code,
          linked_at
        }
      })
    })

    const { error: existingCoursesError, data: existingCoursesData } = await supabase
      .from("classes")
      .select("class_name")
      .in("class_name", Array.from(allCourses))

    if (existingCoursesError) {
      console.error("Error fetching classes");
      toast.error("Failed to update profile.");
      return;
    }

    await supabase
      .from("brother_classes")
      .delete()
      .eq("uniqname", uniqname)

    const existingCourses = new Set((existingCoursesData || []).map((course) => course.class_name));
    const missingCourses = Array.from(allCourses).filter(course => !existingCourses.has(course));

    if (missingCourses.length > 0) {
      const { error: insertCourseError } = await supabase
        .from("classes")
        .insert(missingCourses.map((course) => ({ class_name: course })))

      if (insertCourseError) {
        console.error("Error inserting classes");
        toast.error("Failed to update profile.");
        return;
      }
    }

    const { error: classesError } = await supabase
      .from("brother_classes")
      .insert(newCourses)

    if (classesError) {
      console.error("Update error:", classesError.message);
      toast.error("Failed to update profile.");
      return;
    }

    if (uploaded?.imageUrl) {
      setCurrentImageUrl(uploaded.imageUrl);
      setSelectedFile(null);
      const fileInput = document.querySelector('#profile-picture-input');
      if (fileInput) fileInput.value = '';
      if (previousStorageKey) {
        try {
          await getBrowserClient().storage.from("profile-pictures").remove([previousStorageKey]);
        } catch { }
      }
    }

    toast.success("Profile updated successfully!");
    form.reset(payload); // optional: reset to new values
    router.refresh();     // refresh the page (optional)
    setTimeout(() => {
      router.push("/profile"); // ✅ redirect to profile page
    }, 1000); // wait for toast to be readable before redirecting
  }

  return (
    <Form {...form} className="px-12">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-0 justify-between items-start">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="w-full mr-8">
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      className="text-sm"
                      placeholder=""
                      type="text"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="major"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Major</FormLabel>
                  <FormControl>
                    <Input
                      className="text-sm"
                      placeholder=""
                      type="text"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>** Separate by comma if double majoring</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-0 justify-between items-start">
            <div className="flex flex-col gap-2 w-full mr-8">
              <FormLabel>Profile Picture</FormLabel>
              {currentImageUrl && (
                <div className="flex flex-col items-left space-y-2">
                  <Image
                    width={96}
                    height={96}
                    src={currentImageUrl}
                    alt="Current profile picture"
                    className="w-24 h-24 rounded-sm object-cover border-2 border-gray-200"
                  />
                  <p className="text-sm text-muted-foreground">Current profile picture</p>
                </div>
              )}
              <Input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setSelectedFile(file);
                  if (file) {
                    form.clearErrors("root");
                  }
                }}
                id="profile-picture-input"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("profile-picture-input")?.click()}
                className="justify-start text-left px-3"
              >
                {selectedFile ? selectedFile.name : "Choose File"}
              </Button>
              <FormDescription>Upload a JPEG, PNG, or WebP (max 5MB). The image will be uploaded when you submit.</FormDescription>
              {form.formState.errors.root?.message && (
                <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
              )}
            </div>
            <div className="flex flex-col w-full gap-4">
              <FormField
                control={form.control}
                name="graduation_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Graduation Year</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full lg:w-[200px]">
                          <SelectValue placeholder="Choose a year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
              <FormField
                control={form.control}
                name="minor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minor</FormLabel>
                    <FormControl>
                      <Input
                        className="text-sm"
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>** Leave blank if N/A</FormDescription>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full lg:w-[200px]">
                          <SelectValue placeholder="Choose your grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="freshman">Freshman</SelectItem>
                        <SelectItem value="sophomore">Sophomore</SelectItem>
                        <SelectItem value="junior">Junior</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="graduate_student">Graduate Student</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-0 justify-between items-start mb-4">
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem className="w-full mr-8">
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <PhoneNumberInput
                      form={form}
                      initialValue={form.watch("phone_number")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="current_class_number"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Class</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full lg:w-[200px]">
                        <SelectValue placeholder="Choose your class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Alpha">Alpha</SelectItem>
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
        <FormLabel className="mb-2">Courses Taken</FormLabel>
        <div className="space-y-4">
          {fields.map((field, index) => {
            const term = form.watch(`courses.${index}.term`);
            const options = courseOptions[index] || [];
            const search = searchText[index] || "";

            return (
              <div key={field.id} className="border p-4 rounded-md space-y-1.5">
                <div className="sm:flex sm:flex-row flex-col items-start gap-x-4">
                  <div>
                    <FormLabel className="w-32 mb-2">Term {index + 1}</FormLabel>
                    <FormField
                      control={form.control}
                      name={`courses.${index}.term`}
                      render={({ field }) => (
                        <FormItem className="w-full sm:w-32 flex-shrink-0 mb-2">
                          <FormControl>
                            <Input
                              className="text-sm"
                              {...field}
                              placeholder="e.g. Fall 2023"
                              onChange={(e) => {
                                setTermValidity((prev) => ({
                                  ...prev,
                                  [index]: false
                                }))
                                form.setValue(`courses.${index}.classes`, [], {
                                  shouldValidate: false,
                                  shouldDirty: true,
                                });
                                field.onChange(e.target.value);
                                if (termInputDebounce.current[index]) {
                                  clearTimeout(termInputDebounce.current[index]);
                                }
                                termInputDebounce.current[index] = setTimeout(() => {
                                  if (isValidTerm(e.target.value)) {
                                    setTermValidity((prev) => ({
                                      ...prev,
                                      [index]: true
                                    }))
                                    form.clearErrors(`courses.${index}.term`);
                                    form.clearErrors(`courses.${index}.classes`);
                                  } else {
                                    setTermValidity((prev) => ({
                                      ...prev,
                                      [index]: false
                                    }))
                                    form.setError(`courses.${index}.term`, {
                                      type: "manual",
                                      message: "Invalid term format",
                                    });
                                  }
                                }, 300);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex-grow">
                    <FormLabel className="mb-2">Courses</FormLabel>
                    <FormField
                      control={form.control}
                      name={`courses.${index}.classes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <MultiSelect
                              onChange={field.onChange}
                              input={search}
                              options={options}
                              termValidity={termValidity[index]}
                              onInputChange={(input) => {
                                setSearchText((prev) => ({
                                  ...prev,
                                  [index]: input
                                }));
                                if (courseSearchDebounce.current[index]) {
                                  clearTimeout(courseSearchDebounce.current[index]);
                                }
                                courseSearchDebounce.current[index] = setTimeout(() => {
                                  handleCourseSearch(term, input).then((newCourseOptions) => {
                                    setCourseOptions((prev) => ({
                                      ...prev,
                                      [index]: [...newCourseOptions]
                                    }));
                                  });
                                }, 300);
                              }}
                              placeholder="Search"
                              form={form}
                              index={index}
                            />
                          </FormControl>
                          <FormMessage className="flex-grow" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      remove(index);
                    }}
                    className="cursor-pointer mt-2 sm:mt-[22px]"
                  >
                    <Trash />Remove Term
                  </Button>
                </div>
              </div>
            );
          })}
          <Button
            type="button"
            variant="secondary"
            className="cursor-pointer w-[168px] mb-4"
            onClick={() => append({ term: "", classes: [] })}
          >
            <ListPlus />Add Another Term
          </Button>
        </div>
        <Button
          className="cursor-pointer w-[80px] mr-2"
          type="button"
          variant="outline"
          onClick={() => {
            router.push("/profile");
          }}
        >
          Cancel
        </Button>
        <Button className="cursor-pointer w-[80px]" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2Icon className="animate-spin" /> : "Submit"}
        </Button>
      </form>
    </Form>
  )
}