import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function SearchBar({ value, handleQueryChange }) {
  return (
    <div className="relative w-1/4">
      <Search className="absolute pl-2 top-1/2 -translate-y-1/2"/>
      <Input
        type="search"
        className="pl-8"
        placeholder="Search"
        value={ value }
        onChange={ handleQueryChange }
      />
    </div>
  )
}