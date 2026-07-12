"use client";

import type { ComponentProps, ReactNode } from "react";
import AlertPrimitive from "@/components/ui/Alert";
import BadgePrimitive from "@/components/ui/Badge";
import ButtonPrimitive from "@/components/ui/Button";
import CardPrimitive from "@/components/ui/Card";
import ProgressPrimitive from "@/components/ui/Progress";
import SkeletonPrimitive from "@/components/ui/Skeleton";
import TabsPrimitive from "@/components/ui/Tabs";
import { cn } from "@/lib/utils";

export function Card({ className, size = "default", ...props }: ComponentProps<typeof CardPrimitive> & { size?: "default" | "sm" }) {
  return <CardPrimitive bodyClass={cn("flex flex-col gap-4", size === "sm" ? "p-4" : "p-6")} className={className} {...props} />;
}
export function CardHeader({ className, ...props }: ComponentProps<"div">) { return <div className={cn("grid gap-1", className)} {...props} />; }
export function CardTitle({ className, ...props }: ComponentProps<"div">) { return <div className={cn("text-base font-semibold leading-snug", className)} {...props} />; }
export function CardDescription({ className, ...props }: ComponentProps<"div">) { return <div className={cn("text-sm text-muted-foreground", className)} {...props} />; }
export function CardContent({ className, ...props }: ComponentProps<"div">) { return <div className={className} {...props} />; }
export function CardFooter({ className, ...props }: ComponentProps<"div">) { return <div className={cn("-mx-6 -mb-6 mt-auto flex items-center border-t bg-muted/50 p-6", className)} {...props} />; }

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";
export function Badge({ children, className, variant = "default" }: { children: ReactNode; className?: string; variant?: BadgeVariant }) {
  const colors: Record<BadgeVariant, string> = {
    default: "bg-primary text-white", secondary: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100",
    destructive: "bg-error-subtle text-error", outline: "border border-gray-300 bg-transparent text-gray-700 dark:border-gray-600 dark:text-gray-100",
  };
  return <BadgePrimitive content={children as string | number} className={cn(colors[variant], className)} />;
}

type ButtonVariant = "default" | "outline" | "secondary" | "ghost" | "destructive";
export function Button({ variant = "default", ...props }: Omit<ComponentProps<typeof ButtonPrimitive>, "variant"> & { variant?: ButtonVariant }) {
  const ecmeVariant = variant === "default" || variant === "destructive" ? "solid" : variant === "ghost" ? "plain" : "default";
  return <ButtonPrimitive variant={ecmeVariant} {...props} />;
}

export function Alert({ variant = "default", ...props }: ComponentProps<"div"> & { variant?: "default" | "destructive" }) {
  return <AlertPrimitive type={variant === "destructive" ? "danger" : "info"} showIcon className="w-full"><div className="grid gap-1" {...props} /></AlertPrimitive>;
}
export function AlertTitle({ className, ...props }: ComponentProps<"div">) { return <div className={cn("font-semibold", className)} {...props} />; }
export function AlertDescription({ className, ...props }: ComponentProps<"div">) { return <div className={cn("text-sm", className)} {...props} />; }
export function Progress({ value = 0 }: { value?: number | null }) { return <ProgressPrimitive percent={value ?? 0} showInfo={false} />; }
export const Skeleton = SkeletonPrimitive;
export const Tabs = TabsPrimitive;
export const TabsList = TabsPrimitive.TabList;
export const TabsTrigger = TabsPrimitive.TabNav;
export const TabsContent = TabsPrimitive.TabContent;
