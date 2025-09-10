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
import { termCodeToWords } from "./term-functions";
import { ChevronRight } from "lucide-react";

export default function CourseResults({ results, query, filter }) {
  const [openStates, setOpenStates] = useState({});

  if (results.length === 0 || filter.length === 0) {
    return (
      <p>No results found for <strong>{query}</strong></p>
    )
  }

  const filteredResults = results.map(({ class_name, students }) => {
    const filteredStudents = students.filter(({ term_code }) =>
      filter.includes(term_code)
    );
    const studentSet = new Set(filteredStudents.map(s => s.name));
    return {
      class_name,
      students: filteredStudents,
      uniqueStudents: studentSet.size
    };
  })
    .filter(({ students }) => students.length > 0);


  const toggleOpen = (key) => {
    setOpenStates((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  return (
    <>
      {filteredResults.map((item) => {
        const key = item.class_name;
        const isOpen = openStates[key] || false;
        return (
          <Card key={key}>
            <Collapsible open={isOpen} onOpenChange={() => toggleOpen(key)}>
              <CardHeader className="px-0">
                <CollapsibleTrigger className="w-full justify-between font-semibold flex cursor-pointer">
                  <div className="flex">
                    <ChevronRight className={`transition-transform duration-300 ease-in-out ${isOpen ? "rotate-90" : "rotate-0"}`} />
                    <span>{item.class_name.replace(/(\D+)(\d+)/, "$1 $2")}</span>
                  </div>
                  <span className="font-normal">{item.uniqueStudents} {item.uniqueStudents === 1 ? "student" : "students"}</span>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent className="transition-all duration-300 ease-in-out overflow-hidden">
                <CardContent className="px-6">
                  {item.students.map((student, j) => (
                    <div key={j} className="flex py-2 mt-2">
                      <div className="w-64">{student.name}</div>
                      <div>{<em>{termCodeToWords(student.term_code)}</em>}</div>
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