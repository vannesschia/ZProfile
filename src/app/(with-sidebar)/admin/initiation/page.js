'use client'

import { useEffect, useState, useMemo } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { AttendanceDualListbox } from "../events/event-editor";
import { getBrowserClient } from "@/lib/supbaseClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

async function getPledgeInitiationStatus() {
  const supabase = await getBrowserClient();
  const { data, error } = await supabase.rpc('get_pledge_initiation_status')
  if (error) throw error;
  return data;
}

async function checkPledgeInitiationStatus(uniqname) {
  const supabase = await getBrowserClient();
  const { data, error } = await supabase.rpc('check_pledge_initiation_status', { uniqnames: uniqname })
  if (error) throw error;
  return data;
}

const formSchema = z.object({
  initiation: z.array(z.string().min(1)),
});

export default function InitiationPage() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Prefill selected uniqnames if you have them
      initiation: [],
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const [membersData, setMembersData] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notReadyPledges, setNotReadyPledges] = useState([]);
  const [pending, setPending] = useState(false)

  // Load members and split into available/selected based on form default
  useEffect(() => {
    let mounted = true;
    (async () => {
      // const all = await getPledges(); // must return Person[]
      const all = await getPledgeInitiationStatus(); // must return {uniqname, status}[]
      // console.log(statusData)
      // console.log(all)
      if (!mounted) return;

      const selectedUniqnames = new Set(form.getValues("initiation"));
      const available = all.filter(p => !selectedUniqnames.has(p.uniqname))
        .sort((a,b)=>a.name.localeCompare(b.name));
      const selected = all.filter(p => selectedUniqnames.has(p.uniqname))
        .sort((a,b)=>a.name.localeCompare(b.name));

      setMembersData(all);
      setAvailableMembers(available);
      setSelectedMembers(selected);
      setLoading(false);
    })();
    return () => { mounted = false };
  }, [form]); 

  // Submit handler — form values will contain attendance: string[] (uniqnames)
  const onSubmit = (values) => {
    console.log("submit payload:", values);
    (async () => {
      const checkPledge = await checkPledgeInitiationStatus(values.initiation);
      console.log(checkPledge)
      let notReady = []
      let notReadyNames = []
      checkPledge.forEach(p => {
        if (!p.status) {
          notReady.push(p.uniqname)
          notReadyNames.push(p.name)
        }
      })
      setNotReadyPledges(notReadyNames)
      if (notReady.length > 0) {
        setDialogOpen(true)
      }
    })();
  };

  const onInitiate = async () => {
    setPending(true)
    console.log("Initiating:", selectedMembers.map(m => m.uniqname));
  }

  return (
    <div className="m-4 flex flex-col gap-4">
      <div>
        <p className="text-2xl font-bold tracking-tight leading-tight">Initiation for Zeta Class 🎉</p>
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
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button className="mt-4">Initiate</Button>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={pending}>Go Back</Button>
            <Button variant="" onClick={onInitiate} disabled={pending}>
              {pending ? "Initiating..." : "Let's do it!"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
