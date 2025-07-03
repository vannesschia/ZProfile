'use client'

import { useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import termTranslate from "./term-translate";

export default function CourseResults({ isLoading, results, query }) {
  if (isLoading) {
    return (
      <p>Loading...</p>
    )
  }

  query = query.trim().toUpperCase().replace(/\s+/g, ' ').split(' ').slice(0, 2).join(' ');

  if (results.length === 0) {
    return (
      <p>No results found for <strong>{ query }</strong></p>
    )
  }

  const [filter, setFilter] = useState("All");
  const filteredResults = results.filter((item) => {
    if (filter == "All") {
      return true;
    }
    return item.status === filter.toLowerCase();
  })

  return (
    <>
      <p>Results for <strong>{ query }</strong>:</p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-32" variant="outline">{ filter }</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48" align="start">
          <DropdownMenuRadioGroup value={filter} onValueChange={setFilter}>
            <DropdownMenuRadioItem value="Taking">Taking</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="Taken">Taken</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="All">All</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      { filteredResults.map((item, i) => (
      <Card key={ i }>
        <CardHeader>
          <CardTitle>{ item.name }</CardTitle>
          <CardDescription>
            { item.status === "taken" ? (
              <>
                Taken in <em>{termTranslate(item.term_code)}</em>
              </>
            ) : (
              <>
                Currently taking in <em>{termTranslate(item.term_code)}</em>
              </>
            )}
          </CardDescription>
        </CardHeader>
      </Card>
      ))}
    </>
  )
}