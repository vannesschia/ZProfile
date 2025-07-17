'use client'

import { Laugh, Coffee, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

export default function MilestoneTabs({ events, numCoffeeChats, pledgeProgress }) {
  const [milestone, setMilestone] = useState(0);
  const keys = Object.keys(pledgeProgress);
  const today = new Date();
  console.log(keys);
  console.log(pledgeProgress);

  useEffect(() => {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const currMilestone = pledgeProgress[key];
      if(currMilestone.daysLeft < 0 && (numCoffeeChats < currMilestone.cc || events.length < currMilestone.cp)) {
        setMilestone(i);
        break;
      } else if(currMilestone.daysLeft >= 0) {
        setMilestone(i);
        break;
      }
    }
  }, [pledgeProgress]);

  return (
    <>
      <div className="bg-background border-2 border-secondary rounded-lg flex-shrink-0 w-full max-w-[30rem] min-w-fit">
        <div className="w-full border-b-2 border-muted px-6 py-4 flex flex-row justify-between">
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <h2 className="text-2xl font-bold tracking-tight leading-tight w-fit">Pledge Progress</h2>
            <Badge 
              variant="default"
              className="rounded-full align-middle leading-none max-h-7"
            >
              {pledgeProgress[keys[milestone]].title}
            </Badge>
          </div>
          <div className="flex flex-row gap-2">
            <Button
              variant="outline"
              size="icon" className="size-7"
              onClick={() => {setMilestone(prev => prev - 1)}}
              disabled = {milestone == 0}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon" className="size-7"
              onClick={() => {setMilestone(prev => prev + 1)}}
              disabled = {milestone == keys.length-1}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>

        <div className="flex flex-row justify-between md:justify-normal md:gap-12 p-6">
          <div className="flex flex-col gap-4">
            <p className="text-sm tracking-tight leading-tight">Coffee Chats</p>
            <div className="flex flex-col gap-2 items-start">
              <div className="flex flex-row items-end">
                <Coffee className="w-8 h-8 mr-2"/>
                <p className={`${pledgeProgress[keys[milestone]].daysLeft < 0 && numCoffeeChats < pledgeProgress[keys[milestone]].cc ? "text-red-700" : "text-primary" } font-medium text-3xl`}>{ numCoffeeChats }</p>
                <p className="font-medium text-base text-muted-foreground">/{ pledgeProgress[keys[milestone]].cc }</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-sm tracking-tight leading-tight">Committee Points</p>
            <div className="flex flex-col gap-2 items-start">
              <div className="flex flex-row items-end">
                <Laugh className="w-8 h-8 mr-2"/>
                <p className={`${pledgeProgress[keys[milestone]].daysLeft < 0 && events.length < pledgeProgress[keys[milestone]].cp ? "text-red-700" : "text-primary" } font-medium text-3xl`}>{ events.length }</p>
                <p className="font-medium text-base text-muted-foreground">/{ pledgeProgress[keys[milestone]].cp }</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-sm tracking-tight leading-tight">Due by</p>
            <div className="flex flex-col gap-2">
              <p className="font-medium text-3xl">{ pledgeProgress[keys[milestone]].dueDate }</p>
              {pledgeProgress[keys[milestone]].daysLeft < 0 ? 
                <p className="text-xs leading-tight text-muted-foreground">{ pledgeProgress[keys[milestone]].daysLeft * -1 } {pledgeProgress[keys[milestone]].daysLeft * -1 > 1 ? "days" : "day"} late!</p>
                : <p className="text-xs leading-tight text-muted-foreground">{ pledgeProgress[keys[milestone]].daysLeft } {pledgeProgress[keys[milestone]].daysLeft > 1 ? "days" : "day"} left.</p>
              }
            </div>
          </div>
        </div>
      </div>
    </>
  )
}