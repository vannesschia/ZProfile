'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import termTranslate from "./term-translate";
import { ChevronRight } from "lucide-react";

export default function CourseResults({ results, query, filter }) {
  if (results.length === 0) {
    return (
      <p>No results found for <strong>{ query }</strong></p>
    )
  }

  const filteredResults = results.filter(({ students }) =>
    students.some(({ status }) =>
      filter === "All" || filter.toLowerCase() === status
    )
  )

  const [openStates, setOpenStates] = useState({});

  const toggleOpen = (i) => {
    setOpenStates((prev) => ({
      ...prev,
      [i]: !prev[i],
    }));
  }

  return (
    <>
      { filteredResults.map((item, i) => {
        const isOpen = openStates[i] || false;
        return (
          <Card key={i}>
            <Collapsible open={isOpen} onOpenChange={() => toggleOpen(i)}>
              <CardHeader>
                <CollapsibleTrigger className="w-full justify-between font-semibold flex cursor-pointer">
                  <div className="flex">
                    <ChevronRight className={`transition-transform duration-300 ease-in-out ${isOpen ? "rotate-90" : "rotate-0"}`}/>
                    <span>{ item.subject_code } { item.catalog_number }</span>
                  </div>
                  <span className="font-normal">{item.students.length} {item.students.length === 1 ? "student" : "students"}</span>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent className="transition-all duration-300 ease-in-out overflow-hidden">
                <CardContent>
                  { item.students.map((student, j) => (
                    <div key={j} className="flex ml-4 px-4 py-2 mt-2">
                      <div className="w-64">{ student.name }</div>
                      <div>{student.status === "taking" ? "Currently taking" : <>Taken in <em>{termTranslate(student.term_code)}</em></>}</div>
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </>
  )
}