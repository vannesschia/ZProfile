import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatMonthDay(isoDateString) {
  const date = new Date(isoDateString);
  return date.toLocaleString('en-US', { month: 'numeric', day: 'numeric'});
}

export function capitalizeFirstLetter(str) {
  if (!str) return str;
    return str
      .split('_')
      .map(word => 
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
      )
      .join(' ');
}