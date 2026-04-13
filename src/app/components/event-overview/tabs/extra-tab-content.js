"use client";

import { useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExtraTabContent({
  coffeeChatOffset,
  excusedToConsider,
  unexcused,
  totalExtraPoints,
  multiplier = 3,
  completedExtraPoints,
}) {
  const [expanded, setExpanded] = useState(false);

  const offsetOwed = Number(coffeeChatOffset) || 0;
  const absenceCount =
    (Number(unexcused) || 0) + (Number(excusedToConsider) || 0);
  const absenceOwedPoints = multiplier * absenceCount;

  const fulfilledOffset = completedExtraPoints?.fulfilledCoffeeChatOffset ?? 0;
  const fulfilledAbsences = completedExtraPoints?.fulfilledExtraPointsFromAbsences ?? 0;

  // <div className={`border-2 rounded-lg border-muted flex-shrink-0 w-full max-w-[30rem] min-w-fit`}>
  // <div className="w-full border-b-2 border-inherit px-6 py-4 flex flex-row justify-between">
  //   <div className="flex flex-col md:flex-row gap-2 md:items-center">

  return (
    <div
      className={`flex min-w-0 flex-shrink-0 overflow-hidden rounded-lg border-2 border-secondary bg-background transition-[max-width] duration-200 ease-out ${
        expanded
          ? "w-full max-w-[min(42rem,100%)] flex-col sm:flex-row"
          : "w-full flex-col md:max-w-[15rem]"
      }`}
    >
      <div className="flex w-full min-w-0 flex-col sm:w-[15rem] sm:max-w-[15rem] sm:shrink-0">
        <div className="flex w-full flex-row items-center justify-between border-b-2 border-inherit px-6 py-4">
          <h2 className="text-2xl font-bold leading-tight tracking-tight">Extra</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>
        </div>
        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-1">
            <p className="text-sm tracking-tight text-muted-foreground">Total extra points</p>
            <div className="flex flex-row items-end">
              <p className="text-3xl font-medium tabular-nums">
                {completedExtraPoints?.totalExtraFulfilled ?? 0}
              </p>
              <p className="text-base font-medium text-muted-foreground">/{totalExtraPoints}</p>
            </div>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="flex min-w-0 flex-1 flex-col border-t-2 border-inherit sm:border-l-2 sm:border-t-0">
          <div className="border-b-2 border-inherit px-6 py-4">
            <h3 className="text-2xl font-semibold tracking-tight text-muted-foreground">
              Breakdown
            </h3>
          </div>
          <div className="flex flex-col gap-6 p-6">
            <BreakdownBlock
              title="Extra coffee chats"
              subtitle="Only excess coffee chats (above milestone CC) apply."
              fulfilled={fulfilledOffset}
              owed={offsetOwed}
              owedKind="offset units"
            />
            <BreakdownBlock
              title="Absences (excused + unexcused)"
              subtitle={"Leftover excess chats + excess committee points apply."}
              fulfilled={fulfilledAbsences}
              owed={absenceOwedPoints}
              owedKind="points"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BreakdownBlock({ title, subtitle, fulfilled, owed, owedKind }) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-medium tracking-tight">{title}</p>
        <p className="text-xs leading-snug text-muted-foreground">{subtitle}</p>
      </div>
      <p className="tabular-nums">
        <span className="text-3xl font-semibold">{fulfilled}</span>
        <span className="text-base text-muted-foreground">/{owed}</span>
        {/* <span className="ml-1.5 text-xs text-muted-foreground">fulfilled / owed ({owedKind})</span> */}
      </p>
    </div>
  );
}
