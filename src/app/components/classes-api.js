import { wordsToTermCode } from "../(with-sidebar)/course-directory/term-functions";

export default async function handleCourseSearch(term, input) {
  input = input.trim().toLowerCase().replace(/\s+/g, " ");
  const arr = input.split(" ");
  if (!input || arr.length > 2) {
    return [];
  }

  const termCode = wordsToTermCode(term);
  const subjectCode = arr[0].toUpperCase();
  
  const result = await fetch("/api/fetch-courses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ termCode, subjectCode })
  });

  if (!result.ok) {
    console.error("Failed to fetch course list");
    return [];
  }

  const courses = await result.json();
  return courses.map(course => ({
    className: `${subjectCode} ${course.CatalogNumber}`,
    classDescription: course.CourseDescr,
  }));
}