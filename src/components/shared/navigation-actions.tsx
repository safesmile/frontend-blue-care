import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router";
import { ArrowLeftIcon } from "@/icons";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils";

export function BackLink({ children, className, ...props }: LinkProps) {
  return (
    <Link
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        className,
      )}
      {...props}
    >
      <ArrowLeftIcon aria-hidden="true" className="size-4 rtl:rotate-180" />
      {children}
    </Link>
  );
}

export function TableActionLink({
  label,
  icon,
  to,
}: {
  label: string;
  icon: ReactNode;
  to: LinkProps["to"];
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            to={to}
            aria-label={label}
            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
          />
        }
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
