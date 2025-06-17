import { ChevronRight } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { formatMonthDay } from "@/lib/utils"
import { DataTable } from "./committee-events/data-table"

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function CommitteeEvents({ items }) {
  return(
    <>
      <Collapsible>
        <CollapsibleTrigger asChild>
          <div className="group flex items-center gap-2">
            <ChevronRight
              className="transition-transform duration-200 group-data-[state=open]:rotate-90"
            />
            <span className="text-lg font-semibold">Committee Events</span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-2.5">
          {/* <div className="border-l-2 border-secondary">
            {items.map((item, key) => {
              return (
              <div key={key} className="pl-6 flex flex-row w-full justify-between items-center">
                <p className="font-semibold">{item.name}</p>
                <div className="flex flex-row gap-2 items-center">
                  <p className="text-xs font-medium">{formatMonthDay(item.event_date)}</p>
                  <Badge variant="secondary">{capitalizeFirstLetter(item.committee)}</Badge>
                </div>
              </div>
            )})}
          </div> */}
          <DataTable data={items} />
        </CollapsibleContent>
      </Collapsible>
    </>
  )
}