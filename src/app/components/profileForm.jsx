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
import { Trash, ListPlus } from "lucide-react";
import { wordsToTermCode, isValidTerm } from "../(with-sidebar)/course-directory/term-functions";
import { useEffect, useRef, useState } from "react";
import MultiSelect from "./multiselect";
import handleCourseSearch from "./classes-api";
import { getBrowserClient } from "@/lib/supbaseClient";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import PhoneNumberInput from "./phone-number/phone-number";

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
  const [uploadingImage, setUploadingImage] = useState(false);
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

  async function handleImageUpload() {
    if (!selectedFile) {
      toast.error("Please select a file first.");
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, or WebP).");
      return;
    }

    // Validate file size (5MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB.");
      return;
    }

    setUploadingImage(true);

    try {
      // Get current user to ensure authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error("Auth error:", userError);
        throw new Error(`Authentication error: ${userError.message}`);
      }

      if (!user) {
        console.error("No user found in session");
        throw new Error("You must be logged in to upload images.");
      }

      // Delete old profile picture if it exists
      if (currentImageUrl) {
        // Extract filename from URL (last part after /)
        const oldFileName = currentImageUrl.split('/').pop();
        if (oldFileName) {
          // Use the same path structure as upload: "profile-pictures/filename"
          const { error: deleteError } = await supabase.storage
            .from("profile-pictures")
            .remove([`profile-pictures/${oldFileName}`]);

          if (deleteError) {
            console.warn("Failed to delete old profile picture:", deleteError);
          }
        }
      }

      // Create unique filename with user identifier
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false // Don't overwrite existing files
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(uploadError.message || "Failed to upload image.");
      }

      // Get public URL for the uploaded file
      const { data: publicData } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);

      const imageUrl = publicData.publicUrl;

      // Update the member record with the new profile picture URL
      const { error: updateError } = await supabase
        .from("members")
        .update({ profile_picture_url: imageUrl })
        .eq("email_address", userEmail);

      if (updateError) {
        console.error("Database update error:", updateError);
        throw new Error("Failed to save profile picture to your account.");
      }

      // Update local state
      setCurrentImageUrl(imageUrl);
      setSelectedFile(null);

      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';

      toast.success("Profile picture uploaded successfully!");

    } catch (error) {
      console.error("Image upload error:", error);
      toast.error(error.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
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

    const payload = {
      ...rest,
      email_address: userEmail,
      major: [major],                 // wrap string as array
      minor: minor ? [minor] : [],    // wrap optional string as array
      onboarding_completed: true
    };

    const { error: membersError } = await supabase
      .from("members")
      .update(payload)
      .eq("email_address", userEmail)

    if (membersError) {
      console.error("Update error:", membersError.message);
      toast.error("Failed to update profile.");
      return;
    }

    const uniqname = userEmail.split("@")[0];

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
                <div className="flex flex-col items-left pl-1 space-y-2">
                  <img
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
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="cursor-pointer pt-1.5 text-sm"
              />
              <Button
                type="button"
                onClick={handleImageUpload}
                disabled={!selectedFile || uploadingImage}
                variant="outline"
                className="w-full justify-start px-3 h-[48px] lg:h-[36px] whitespace-normal"
              >
                {uploadingImage ? "Uploading..." : "Upload Picture (JPEG, PNG, or WebP, max 5MB)"}
              </Button>
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
                      setTermValidity((prev) => ({
                        ...prev,
                        [index]: false
                      }))
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
            className="cursor-pointer mb-4"
            onClick={() => append({ term: "", classes: [] })}
          >
            <ListPlus />Add Another Term
          </Button>
        </div>
        {/* <InputFile /> */}
        <Button
          className="cursor-pointer mr-2"
          type="button"
          variant="outline"
          onClick={() => {
            router.push("/profile");
          }}
        >
          Cancel
        </Button>
        <Button className="cursor-pointer" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Submit"}
        </Button>
      </form>
    </Form>
  )
}