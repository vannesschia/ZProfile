import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatMonthDay(isoDateString) {
  const date = new Date(isoDateString);
  return date.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}