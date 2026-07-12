"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) { return <AccordionPrimitive.Root className={cn("flex w-full flex-col", className)} {...props} />; }
export function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) { return <AccordionPrimitive.Item className={cn("not-last:border-b", className)} {...props} />; }
export function AccordionTrigger({ className, children, ...props }: AccordionPrimitive.Trigger.Props) {
  return <AccordionPrimitive.Header className="flex"><AccordionPrimitive.Trigger className={cn("group flex flex-1 items-start justify-between py-3 text-left text-sm font-medium hover:text-primary", className)} {...props}>{children}<ChevronDownIcon className="ml-auto size-4 shrink-0 group-aria-expanded:hidden" /><ChevronUpIcon className="ml-auto hidden size-4 shrink-0 group-aria-expanded:block" /></AccordionPrimitive.Trigger></AccordionPrimitive.Header>;
}
export function AccordionContent({ className, children, ...props }: AccordionPrimitive.Panel.Props) { return <AccordionPrimitive.Panel className="overflow-hidden text-sm" {...props}><div className={cn("pb-4", className)}>{children}</div></AccordionPrimitive.Panel>; }
