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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserClient } from "@/lib/supbaseClient";


const formSchema = z.object({
  name: z.string().min(1).transform((val) => val.trim()), //removes whitespace from name
  major: z.string().min(1),
  minor: z.string().min(1).optional(),
  grade: z.string().min(1),
  graduation_year: z.coerce.number().int().min(2020),
  current_class_number: z.string().min(1),
  email_address: z.string().min(1),
  phone_number: z.string().min(1),
  // Remove profile_picture from main form schema since it's handled separately
});

export function MyForm({ initialData, userEmail }) {
  const router = useRouter();
  const supabase = getBrowserClient();

  // Separate state for profile picture upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(initialData?.profile_picture_url || null);

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

  // Separate function to handle image upload
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
      console.log("Auth check:", { user, userError }); // Debug log

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

  async function onSubmit(values) {
    const { email_address, major, minor, ...rest } = values;

    const payload = {
      ...rest,
      email_address: userEmail,
      major: [major],
      minor: minor ? [minor] : [],
      // profile_picture_url is handled separately and already in database
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
      form.reset(payload);
      router.refresh();
      setTimeout(() => router.push("/profile"), 1000);
    }

    console.log("Submitting payload:", payload);
  }


  return (
    <Form {...form} className="px-12">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
        {/* Full name - full width */}


        {/* Two column grid for remaining fields */}
        <div className="grid grid-cols-2 gap-8">
          {/* Left column */}
          <div className="space-y-6">
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
            {/* Profile Picture Upload Section */}
            <div className="space-y-4">
              <FormLabel>Profile Picture</FormLabel>

              {/* Current image preview */}
              {currentImageUrl && (
                <div className="flex flex-col items-center space-y-2">
                  <img
                    src={currentImageUrl}
                    alt="Current profile picture"
                    className="w-24 h-24 rounded-sm object-cover border-2 border-gray-200"
                  />
                  <p className="text-sm text-muted-foreground">Current profile picture</p>
                </div>
              )}

              {/* File input */}
              <Input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />

              {/* Upload button */}
              <Button
                type="button"
                onClick={handleImageUpload}
                disabled={!selectedFile || uploadingImage}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {uploadingImage ? "Uploading..." : "Upload Picture"}
              </Button>

              <FormDescription>
                Upload a profile picture (JPEG, PNG, or WebP, max 5MB)
              </FormDescription>
            </div>
            

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
                  <FormDescription> ** Separate by comma if double majoring</FormDescription>
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

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Submit"}
        </Button>
      </form>
    </Form>
  )
}