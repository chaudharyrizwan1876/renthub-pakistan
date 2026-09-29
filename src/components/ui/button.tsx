import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Check } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60 [&_svg]:shrink-0 min-h-11 sm:min-h-10",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:-translate-y-px hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25",
        whatsapp: "bg-whatsapp text-white shadow-sm hover:-translate-y-px hover:bg-whatsapp-hover hover:shadow-lg hover:shadow-whatsapp/30",
        secondary: "bg-muted text-foreground hover:bg-border",
        outline: "border border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        destructive: "bg-danger text-white hover:-translate-y-px hover:opacity-90 hover:shadow-lg dark:text-black",
        link: "min-h-0 text-primary underline-offset-4 hover:underline active:scale-100 sm:min-h-0",
      },
      size: {
        default: "px-4 py-2",
        sm: "min-h-9 px-3 py-1.5 text-[13px] sm:min-h-9",
        lg: "min-h-12 px-6 text-base sm:min-h-12",
        icon: "size-11 sm:size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Shows a spinner, swaps the label for `loadingText` and blocks clicks. */
  loading?: boolean;
  loadingText?: React.ReactNode;
  /** Shows a check mark with `successText` (e.g. right after a successful sign in, before redirecting). */
  success?: boolean;
  successText?: React.ReactNode;
}

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, loading, loadingText, success, successText, children, disabled, ...props }, ref) => {
    if (asChild) {
      return <Slot ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>{children}</Slot>;
    }
    const busy = !!loading || !!success;
    return (
      <button
        ref={ref}
        disabled={disabled || busy}
        aria-busy={loading || undefined}
        data-state={success ? "success" : loading ? "loading" : undefined}
        className={cn(
          buttonVariants({ variant, size }),
          // keep full colour while busy (disabled:opacity would make it look broken)
          busy && "disabled:opacity-100",
          loading && "btn-shimmer cursor-progress",
          success && "!bg-emerald-600 !text-white",
          className,
        )}
        {...props}
      >
        {success ? (
          <span key="ok" className="inline-flex items-center gap-2 animate-pop-in">
            <span className="flex size-5 items-center justify-center rounded-full bg-white/25">
              <Check className="size-3.5 animate-draw-check" strokeWidth={3} aria-hidden="true" />
            </span>
            {successText ?? children}
          </span>
        ) : loading ? (
          <span key="busy" className="inline-flex items-center gap-2 animate-fade-in">
            <Spinner />
            {loadingText ?? children}
          </span>
        ) : (
          children
        )}
        <span className="sr-only" aria-live="polite">
          {loading ? "Please wait" : success ? "Done" : ""}
        </span>
      </button>
    );
  },
);
Button.displayName = "Button";
