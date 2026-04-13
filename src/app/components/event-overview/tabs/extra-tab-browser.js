"use client";

import { useEffect, useState } from "react";
import { getExtraTabData, getCompletedExtra } from "../../../(with-sidebar)/dashboard/_lib/queries";
import ExtraTabContent from "./extra-tab-content";
import { getBrowserClient } from "@/lib/supbaseClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExtraTabBrowser({ uniqname, memberRole }) {
  const [data, setData] = useState(null);
  const [completed, setCompleted] = useState(null);
  const [error, setError] = useState(null);

  const supabase = getBrowserClient();

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [result, extra] = await Promise.all([
          getExtraTabData(uniqname, supabase, memberRole),
          getCompletedExtra(uniqname, supabase, memberRole),
        ]);
        if (!ignore) setData(result);
        if (!ignore) setCompleted(extra);
      } catch (e) {
        if (!ignore) setError(e.message);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [uniqname, memberRole]);

  if (error) return <div className="text-red-600">Failed: {error}</div>;
  if (data === null || completed === null) {
    return (
      <div className="w-full min-w-fit md:max-w-[20rem] flex-shrink-0 rounded-lg border-2 border-secondary overflow-hidden">
        <Skeleton className="h-[52px] w-full rounded-none" />
        <div className="p-6 flex flex-col gap-4">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return <ExtraTabContent {...data} completedExtraPoints={completed} />;
}
