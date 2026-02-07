import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { HTMLAttributes, forwardRef } from "react";

const headingVariants = cva("font-bold tracking-tight", {
  variants: {
    size: {
      h1: "text-4xl sm:text-5xl md:text-7xl lg:text-8xl",
      h2: "text-3xl sm:text-4xl md:text-5xl lg:text-6xl",
      h3: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl",
      h4: "text-xl sm:text-2xl md:text-3xl",
    },
    gradient: {
      true: "bg-gradient-to-r from-white via-nebula-400 to-blue-200 bg-clip-text text-transparent",
      false: "text-white",
    },
  },
  defaultVariants: {
    size: "h1",
    gradient: false,
  },
});

export interface HeadingProps
  extends HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4";
}

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, size, gradient, as = "h1", children, ...props }, ref) => {
    const Comp = as;
    return (
      <Comp
        ref={ref}
        className={cn(headingVariants({ size, gradient }), className)}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

Heading.displayName = "Heading";
