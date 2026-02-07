import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { HTMLAttributes, forwardRef } from "react";

const textVariants = cva("text-starlight-200", {
  variants: {
    size: {
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
    },
  },
  defaultVariants: {
    size: "base",
    weight: "normal",
  },
});

export interface TextProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div";
}

export const Text = forwardRef<HTMLElement, TextProps>(
  ({ className, size, weight, as = "p", children, ...props }, ref) => {
    const Comp = as as React.ElementType;
    return (
      <Comp
        ref={ref}
        className={cn(textVariants({ size, weight }), className)}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

Text.displayName = "Text";
