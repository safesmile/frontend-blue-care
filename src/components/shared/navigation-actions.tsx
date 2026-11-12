import { Link, type LinkProps } from "react-router";
import { ArrowLeftIcon } from "@/icons";
import { buttonVariants } from "@/components/ui/button";
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
