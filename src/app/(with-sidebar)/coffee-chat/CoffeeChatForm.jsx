"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { getBrowserClient } from "@/lib/supbaseClient";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CheckIcon } from "lucide-react";
import ImageUpload from "@/app/components/image-upload";
import SubmitButton from "@/app/components/submit-button";

//store pledge/brother by uniqname to match FK to members.uniqname
const formSchema = z.object({
  pledge: z.string().min(1, "Pledge is required").transform((v) => v.trim()),
  brother: z
    .string()
    .min(1, "Brother is required")
    .transform((v) => v.trim()),
  chat_date: z
    .string()
    .regex(/\d{4}-\d{2}-\d{2}/, "Please select a valid date (YYYY-MM-DD)"),
  image_proof: z.any().refine((file) => file !== null && file !== undefined, {
    message: "Photo proof is required",
  }),
});

export default function CoffeeChatForm() {
  const supabase = getBrowserClient();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [memberOptions, setMemberOptions] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [currentUserUniqname, setCurrentUserUniqname] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [brotherQuery, setBrotherQuery] = useState("");
  const [brotherOpen, setBrotherOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pledge: "",
      brother: "",
      chat_date: "",
      image_proof: null,
    },
  });

  //load current user and auto-fill pledge field
  useEffect(() => {
    let isMounted = true;
    async function loadCurrentUser() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) return;

        const { data: memberData, error: memberError } = await supabase
          .from("members")
          .select("uniqname, name")
          .eq("email_address", user.email)
          .single();
        
        if (memberError) throw memberError;
        if (!isMounted) return;
        
        setCurrentUserUniqname(memberData.uniqname);
        setCurrentUserName(memberData.name || memberData.uniqname);
        form.setValue("pledge", memberData.uniqname);
      } catch (err) {
        console.error("Failed to load current user:", err);
        toast.error("Failed to load your profile");
      }
    }
    loadCurrentUser();
    return () => {
      isMounted = false;
    };
  }, [supabase, form]);

  //load members so we can pick by name but submit uniqname to satisfy FK
  useEffect(() => {
    let isMounted = true;
    async function loadMembers() {
      setLoadingMembers(true);
      try {
        const { data, error } = await supabase
          .from("members")
          .select("name, uniqname, role")
          .eq("role", "brother")
          .order("role", { ascending: true })
          .order("name", { ascending: true });
        if (error) throw error;
        if (!isMounted) return;
        const options = (data || []).map((m) => ({
          label: m.name || m.uniqname,
          value: m.uniqname,
        }));
        setMemberOptions(options);
      } catch (err) {
        console.error("Failed to load members:", err);
        toast.error("Failed to load members");
      } finally {
        if (isMounted) setLoadingMembers(false);
      }
    }
    loadMembers();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  async function onSubmit(values) {
    // Validate file (already checked by schema but adding extra validation)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(values.image_proof.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, or WebP).");
      return;
    }
    if (values.image_proof.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB.");
      return;
    }

    setIsSubmitting(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw new Error(userError.message || JSON.stringify(userError));
      if (!user) throw new Error("You must be logged in to submit.");

      //ensures values match existing members (by uniqname)
      const validPledge = memberOptions.some((o) => o.value === values.pledge);
      const validBrother = memberOptions.some((o) => o.value === values.brother);
      if (!validPledge) throw new Error("Please choose a valid pledge from the list.");
      if (!validBrother) throw new Error("Please choose a valid brother from the list.");

      //creating the row without image first 
      const { data: insertData, error: insertError } = await supabase
        .from("coffee_chats")
        .insert({
          pledge: values.pledge,
          brother: values.brother,
          chat_date: values.chat_date,
        })
        .select("id")
        .single();
      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error(insertError.message || JSON.stringify(insertError));
      }

      const createdChatId = insertData.id;

      //uploading da image
      const fileExt = values.image_proof.name.split(".").pop();
      const fileName = `${createdChatId}-${Date.now()}.${fileExt}`;
      const filePath = `coffee-chat-pictures/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("coffee-chat-pictures")
        .upload(filePath, values.image_proof, {
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(uploadError.message || JSON.stringify(uploadError));
      }

      const { data: publicData } = supabase.storage
        .from("coffee-chat-pictures")
        .getPublicUrl(filePath);
      const imageUrl = publicData.publicUrl;

      // updates row with pic url after the await 
      const { error: updateError } = await supabase
        .from("coffee_chats")
        .update({ image_proof: imageUrl })
        .eq("id", createdChatId);
      if (updateError) {
        console.error("Update error:", updateError);
        throw new Error(updateError.message || JSON.stringify(updateError));
      }

      // resets the form 
      toast.success("Coffee chat submitted successfully!");
      form.reset({ 
        pledge: currentUserUniqname, 
        brother: "", 
        chat_date: "",
        image_proof: null,
      });
      setBrotherQuery("");
      setSelectedFile(null);
      setCurrentImageUrl(null); //clears da photo preview

      // resets file input
      const fileInput = document.querySelector('#coffee-proof-input');
      if (fileInput) fileInput.value = "";
    } catch (err) {
      try {
        const message = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
        console.error("Submit error:", message);
        toast.error(message || "Failed to submit coffee chat.");
      } catch {
        console.error(err);
        toast.error("Failed to submit coffee chat.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        <div className="w-full lg:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
          {/* Left column */}
          <div className="space-y-6">
            <div className="space-y-2">
              <FormLabel>Submitted By</FormLabel>
              <div className="block h-9 px-3 py-1.5 w-full rounded-md border border-input bg-muted text-sm">
                {currentUserName || "Loading..."}
              </div>
              <FormDescription className="text-xs text-muted-foreground">
              </FormDescription>
            </div>
            <FormField
              control={form.control}
              name="image_proof"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo Proof *</FormLabel>
                  {currentImageUrl && (
                    <div className="flex flex-col items-start space-y-2 pl-1">
                      <img
                        src={currentImageUrl}
                        alt="Coffee chat proof"
                        className="w-24 h-24 rounded-sm object-cover border-2 border-gray-200"
                      />
                    </div>
                  )}
                  <FormControl>
                    <ImageUpload 
                      image={selectedFile} 
                      setImage={(file) => {
                        setSelectedFile(file);
                        field.onChange(file);
                      }} 
                      message="Upload a clear selfie (JPEG, PNG, or WebP, max 5MB)"
                    />
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
              name="brother"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brother</FormLabel>
                  <FormControl>
                    <Popover open={brotherOpen} onOpenChange={setBrotherOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setBrotherOpen(!brotherOpen);
                          }}
                          disabled={loadingMembers}
                          className={`block text-left h-9 px-3 py-1 font-normal w-full ${brotherQuery ? "" : "text-muted-foreground"}`}
                        >
                          {loadingMembers
                            ? "Loading"
                            : brotherQuery
                              ? brotherQuery
                              : "Search by name"
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1">
                        <Command>
                          <CommandInput placeholder="Search by name" />
                          <CommandList>
                            <CommandEmpty>No results found.</CommandEmpty>
                            <CommandGroup>
                              {memberOptions.map((opt) => (
                                <CommandItem
                                  key={opt.value}
                                  value={opt.label}
                                  onSelect={(selectedLabel) => {
                                    const selectedOption = memberOptions.find((o) => o.label === selectedLabel);
                                    if (selectedOption) {
                                      setBrotherQuery(selectedOption.label);
                                      field.onChange(selectedOption.value);
                                      setBrotherOpen(false);
                                    }
                                  }}
                                >
                                  {opt.label}
                                  <CheckIcon
                                    className={`mr-2 h-4 w-4 ${brotherQuery === opt.label ? "opacity-100" : "opacity-0"}`}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="chat_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chat Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <SubmitButton submitting={isSubmitting}/>
      </form>
    </Form>
  );
}
