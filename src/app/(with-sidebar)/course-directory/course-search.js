'use client'

import { useState, useEffect } from "react"
import searchCourses from "./search-courses";
import CourseResults from "./course-results";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ListFilter, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { termCodeToWords } from "./term-functions";
import { Input } from "@/components/ui/input";

export default function CourseSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState([]);
  const [uniqueTerms, setUniqueTerms] = useState([]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setIsLoading(true);
      const query = searchQuery === "" ? "*" : searchQuery;
      searchCourses(query).then((newSearchResults) => {
        setSearchResults(newSearchResults);
        setUniqueTerms(() => {
          const s = new Set();
          newSearchResults.forEach((item) => {
            item.students.forEach((student) => {
              s.add(student.term_code);
            })
          })
          const a = Array.from(s).sort();
          setFilter(a);
          return a;
        })
        setIsLoading(false);
      })
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
        <div className="relative w-full lg:w-1/2 xl:w-1/4">
          <Search className="text-muted-foreground pointer-events-none absolute pl-2 top-1/2 -translate-y-1/2" />
          <Input
            type="search"
            className="pl-8 text-sm"
            placeholder="Search"
            value={searchQuery}
            onChange={handleQueryChange}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-24 ml-4">
              <ListFilter />Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-64 overflow-y-auto min-w-[12rem] w-[var(--radix-popover-trigger-width)]">
            <DropdownMenuLabel>Select terms</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={
                filter.length === uniqueTerms.length &&
                uniqueTerms.every(term => filter.includes(term))
              }
              onCheckedChange={(checked) => {
                setFilter(() => (checked ? uniqueTerms : []));
              }}
              onSelect={(e) => e.preventDefault()}
            >
              Select all
            </DropdownMenuCheckboxItem>
            {uniqueTerms.map((term) => (
              <DropdownMenuCheckboxItem
                key={term}
                checked={filter.includes(term)}
                onCheckedChange={(checked) => {
                  setFilter((prev) => {
                    if (checked) {
                      return [...prev, term];
                    } else {
                      return prev.filter((t) => t !== term);
                    }
                  })
                }}
                onSelect={(e) => e.preventDefault()}
              >
                {termCodeToWords(term)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isLoading
        ?
        <>
          <Skeleton className="mt-2 h-8 w-[100px] rounded-lg" />
          <Skeleton className="h-8 w-[350px] rounded-lg" />
          <Skeleton className="h-8 w-[300px] rounded-lg" />
        </>
        : <CourseResults results={searchResults} query={searchQuery} filter={filter} />
      }
    </>
  )
}