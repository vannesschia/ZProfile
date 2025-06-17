import { ChevronRight } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { formatMonthDay } from "@/lib/utils"

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function RequiredEvents({ items }) {
  return(
    <>
      <Collapsible>
        <CollapsibleTrigger asChild>
          <div className="group flex items-center gap-2">
            <ChevronRight
              className="transition-transform duration-200 group-data-[state=open]:rotate-90"
            />
            <span className="text-lg font-semibold">Required Events</span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-2.5">
          <div className="border-l-2 border-secondary">
            {items.map((item, key) => {
              return (
              <div key={key} className="pl-6 flex flex-row w-full justify-between items-center">
                <p>{item.name}</p>
                <Badge variant="secondary">{capitalizeFirstLetter(item.committee)}</Badge>
                <p>{formatMonthDay(item.event_date)}</p>
              </div>
            )})}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  )
}