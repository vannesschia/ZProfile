'use client'

import { useState, useEffect } from "react"
import SearchBar from "./search-bar";
import searchCourses from "./search-courses";
import CourseResults from "./course-results";
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
import { ListFilter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CourseSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery) {
        setIsLoading(true);
        searchCourses(searchQuery).then((newSearchResults) => {
          setSearchResults(newSearchResults);
          setIsLoading(false);
        })
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleQueryChange = (e) => {
    setSearchQuery(e.target.value);
    setIsLoading(true);
  }

  return (
    <>
      <div className="flex flex-row">
        <SearchBar value={ searchQuery } handleQueryChange={ handleQueryChange }/>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-24 ml-4" variant="outline">
              <ListFilter/>Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-32" align="start">
            <DropdownMenuRadioGroup value={filter} onValueChange={setFilter}>
              <DropdownMenuRadioItem value="Taking">Taking</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Taken">Taken</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="All">All</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      { searchQuery && (isLoading ?
        <>
          <Skeleton className="mt-2 h-8 w-[100px] rounded-lg"/>
          <Skeleton className="h-8 w-[350px] rounded-lg"/>
          <Skeleton className="h-8 w-[300px] rounded-lg"/>
        </> :
        <CourseResults results={ searchResults } query={ searchQuery } filter={ filter }/>)}
    </>
  )
}