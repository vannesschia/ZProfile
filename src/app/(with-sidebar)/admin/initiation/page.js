'use client'

import { useEffect, useState, startTransition } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { AttendanceDualListbox } from "../events/_components/event-editor";
import { getBrowserClient } from "@/lib/supbaseClient";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";

// --- Data helpers ------------------------------------------------------------

async function getPledgeInitiationStatus() {
  const supabase = await getBrowserClient();
  const { data, error } = await supabase.rpc("get_pledge_initiation_status");
  if (error) throw error;
  return data;
}

async function checkPledgeInitiationStatus(uniqnames) {
  const supabase = await getBrowserClient();
  const { data, error } = await supabase.rpc("check_pledge_initiation_status", {
    uniqnames,
  });
  if (error) throw error;
  return data;
}

async function initiatePledges(uniqnames) {
  const supabase = await getBrowserClient();
  const { data, error } = await supabase.rpc("initiate_pledges", {
    p_uniqnames: uniqnames,
  });
  if (error) throw error;
  return data;
}

async function getCurrentClass() {
  const supabase = await getBrowserClient();
  const { data, error } = await supabase
    .from("requirements")
    .select("current_class")
    .single();
  if (error) throw error;
  return data;
}

// --- Form schema -------------------------------------------------------------

const formSchema = z.object({
  initiation: z.array(z.string().min(1)),
});

// --- Component ---------------------------------------------------------------

export default function InitiationPage() {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { initiation: [] },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const [currentClass, setCurrentClass] = useState("");
  const [membersData, setMembersData] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [notReadyPledges, setNotReadyPledges] = useState([]);
  const [isInitiating, setIsInitiating] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const c = await getCurrentClass();
        if (!ignore) setCurrentClass(c.current_class);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { ignore = true };
  }, []);

  
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const all = await getPledgeInitiationStatus();
        if (!mounted) return;

        const selectedUniqnames = new Set(form.getValues("initiation"));
        const byName = (a, b) =>
          (a.name ?? a.uniqname).localeCompare(b.name ?? b.uniqname);

        const available = all
          .filter(p => !selectedUniqnames.has(p.uniqname))
          .sort(byName);

        const selected = all
          .filter(p => selectedUniqnames.has(p.uniqname))
          .sort(byName);

        setMembersData(all);
        setAvailableMembers(available);
        setSelectedMembers(selected);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [form]);

  const onSubmit = async (values) => {
    const check = await checkPledgeInitiationStatus(values.initiation);
    const notReadyNames = check
      .filter(p => !p.status)
      .map(p => p.name ?? p.uniqname);

    setNotReadyPledges(notReadyNames);

    if (notReadyNames.length > 0) {
      setDialogOpen(true);
    } else {
      await onInitiate(values.initiation);
    }
  };

  const onInitiate = async (uniqnamesArg) => {
    const uniqnames =
      uniqnamesArg ?? selectedMembers.map(m => m.uniqname);

    try {
      setIsInitiating(true);
      await initiatePledges(uniqnames);

      form.reset();
      setDialogOpen(false);

      toast.success(
        `Pledges initiated successfully! Congrats to ${currentClass} class 🥳`
      );

      startTransition(() => {
        router.replace("/admin/dashboard");
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to initiate pledges. Please try again.");
    } finally {
      setIsInitiating(false);
    }
  };

  return (
    <div className="m-4 flex flex-col gap-4">
      <div>
        <p className="text-2xl font-bold tracking-tight leading-tight">
          Initiation for {currentClass} Class 🎉
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="initiation"
            render={() => (
              <FormItem>
                <FormControl>
                  <AttendanceDualListbox
                    enableMoveAll
                    allPeople={membersData}
                    availablePeople={availableMembers}
                    setAvailablePeople={setAvailableMembers}
                    selectedPeople={selectedMembers}
                    setSelectedPeople={setSelectedMembers}
                    form={form}
                    formItem="initiation"
                    loading={loading}
                    availableTitle="Pledges"
                    selectedTitle="Brothers-to-be"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="mt-8 cursor-pointer transition-shadow 
                        hover:shadow-[0_0_20px_5px_rgba(0,0,0,0.6)]
                        dark:hover:shadow-[0_0_20px_5px_rgba(255,255,255,0.8)]"
            disabled={isInitiating}
          >
            {isInitiating && <Loader2Icon className="animate-spin" />}
            {isInitiating ? "Initiating..." : "Initiate"}
          </Button>
        </form>
      </Form>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Initiate?</DialogTitle>
            <DialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                <p>The following pledges have not met the initiation requirements:</p>

                {notReadyPledges.length > 0 && (
                  <ul className="my-2 list-disc list-inside">
                    {notReadyPledges.map((p) => (
                      <li key={p} className="capitalize">{p}</li>
                    ))}
                  </ul>
                )}

                <p>Are you sure you want to proceed?</p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isInitiating}
              className="cursor-pointer"
            >
              Go Back
            </Button>

            <Button
              onClick={() => onInitiate()}
              disabled={isInitiating}
              className="cursor-pointer"
            >
              {isInitiating && <Loader2Icon className="animate-spin" />}
              {isInitiating ? "Initiating..." : "Let's do it!"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
