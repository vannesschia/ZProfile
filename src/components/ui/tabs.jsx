"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props} />
  );
}

function TabsList({
  className,
  ...props
}) {
  return (
    <div className="flex flex-row mb-6">
      <TabsPrimitive.List
        data-slot="tabs-list"
        className={cn(
          "w-fit inline-flex justify-start",
          className
        )}
        {...props}
      />
      <div className="flex-1 border-b border-input dark:border-input/50"></div>
    </div>
  )
}

function TabsTrigger({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "flex-none px-3 py-1 text-sm font-semibold tracking-tight whitespace-nowrap",
        "text-muted-foreground border-b border-input dark:border-input/50",
        "transition-colors",

        "data-[state=active]:border-b-2 data-[state=active]:border-foreground",
        "data-[state=active]:text-foreground dark:data-[state=active]:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props} />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
