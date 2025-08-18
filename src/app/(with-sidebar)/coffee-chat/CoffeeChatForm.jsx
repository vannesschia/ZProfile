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

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

//store pledge/brother by uniqname to match FK to members.uniqname
const formSchema = z.object({
  pledge: z.string().min(1, "Pledge is required").transform((v) => v.trim()),
  brother: z
    .string()
    .min(1, "Brother is required")
    .transform((v) => v.trim()),
  chat_date: z
    .string()
    .regex(/\d{4}-\d{2}-\d{2}/, "Please provide a valid date (YYYY-MM-DD)"),
});

export default function CoffeeChatForm() {
  const supabase = getBrowserClient();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [memberOptions, setMemberOptions] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [pledgeQuery, setPledgeQuery] = useState("");
  const [pledgeOpen, setPledgeOpen] = useState(false);
  const [brotherQuery, setBrotherQuery] = useState("");
  const [brotherOpen, setBrotherOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pledge: "",
      brother: "",
      chat_date: "",
    },
  });

  //load members so we can pick by name but submit uniqname to satisfy FK
  useEffect(() => {
    let isMounted = true;
    async function loadMembers() {
      setLoadingMembers(true);
      try {
        const { data, error } = await supabase
          .from("members")
          .select("name, uniqname")
          .order("name", { ascending: true });
        if (error) throw error;
        if (!isMounted) return;
        const options = (data || []).map((m) => ({
          label: m.name ? `${m.name} (${m.uniqname})` : m.uniqname,
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
    if (!selectedFile) {
      toast.error("Please attach a photo as proof.");
      return;
    }

    // Validate file
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, or WebP).");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
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
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${createdChatId}-${Date.now()}.${fileExt}`;
      const filePath = `coffee-chat-pictures/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("coffee-chat-pictures")
        .upload(filePath, selectedFile, {
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
      form.reset({ pledge: "", brother: "", chat_date: "" });
      setPledgeQuery("");
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
    <Card className="max-w-5xl">
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left column */}
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="pledge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pledge</FormLabel>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder={loadingMembers ? "Loading..." : "Search by name or uniqname"}
                          value={pledgeQuery}
                          onChange={(e) => {
                            setPledgeQuery(e.target.value);
                            if (field.value) field.onChange("");
                          }}
                          onFocus={() => setPledgeOpen(true)}
                          onBlur={() => setTimeout(() => setPledgeOpen(false), 100)}
                          disabled={loadingMembers}
                        />
                        {pledgeOpen && (
                          <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-white shadow">
                            {(memberOptions.filter((opt) =>
                              opt.label.toLowerCase().includes(pledgeQuery.toLowerCase()) ||
                              opt.value.toLowerCase().includes(pledgeQuery.toLowerCase())
                            )).map((opt) => (
                              <button
                                type="button"
                                key={`pledge-${opt.value}`}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  field.onChange(opt.value);
                                  setPledgeQuery(opt.label);
                                  setPledgeOpen(false);
                                }}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Photo Proof</FormLabel>

                  {currentImageUrl && (
                    <div className="flex flex-col items-start space-y-2 pl-1">
                      <img
                        src={currentImageUrl}
                        alt="Coffee chat proof"
                        className="w-24 h-24 rounded-sm object-cover border-2 border-gray-200"
                      />
                      {/* <p className="text-sm text-muted-foreground">Current photo</p> */}
                    </div>
                  )}

                  <Input
                    id="coffee-proof-input"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  <FormDescription>
                    Upload a clear selfie (JPEG, PNG, or WebP, max 5MB)
                  </FormDescription>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="brother"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brother</FormLabel>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder={loadingMembers ? "Loading..." : "Search by name or uniqname"}
                          value={brotherQuery}
                          onChange={(e) => {
                            setBrotherQuery(e.target.value);
                            if (field.value) field.onChange("");
                          }}
                          onFocus={() => setBrotherOpen(true)}
                          onBlur={() => setTimeout(() => setBrotherOpen(false), 100)}
                          disabled={loadingMembers}
                        />
                        {brotherOpen && (
                          <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-white shadow">
                            {(memberOptions.filter((opt) =>
                              opt.label.toLowerCase().includes(brotherQuery.toLowerCase()) ||
                              opt.value.toLowerCase().includes(brotherQuery.toLowerCase())
                            )).map((opt) => (
                              <button
                                type="button"
                                key={`brother-${opt.value}`}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  field.onChange(opt.value);
                                  setBrotherQuery(opt.label);
                                  setBrotherOpen(false);
                                }}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
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

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Coffee Chat"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
