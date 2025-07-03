'use client'

import { useState, useEffect } from "react"
import SearchBar from "./search-bar";
import searchCourses from "./search-courses";
import CourseResults from "./course-results";

export default function CourseSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery) {
        console.log(searchQuery);
        setIsLoading(true);
        searchCourses(searchQuery).then((newSearchResults) => {
          console.log(newSearchResults)
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
  }

  return (
    <>
      <SearchBar value={ searchQuery } handleQueryChange={ handleQueryChange }/>
      { searchQuery && <CourseResults isLoading={ isLoading } results={ searchResults } query={ searchQuery }/>}
    </>
  )
}