"use client";

import * as React from "react";
import { useState, useId, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TypewriterProps {
  text: string | string[];
  speed?: number;
  cursor?: string;
  loop?: boolean;
  deleteSpeed?: number;
  delay?: number;
  className?: string;
}

export function Typewriter({
  text,
  speed = 100,
  cursor = "|",
  loop = false,
  deleteSpeed = 50,
  delay = 1500,
  className,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);

  const textArray = Array.isArray(text) ? text : [text];
  const currentText = textArray[textArrayIndex] || "";

  useEffect(() => {
    if (!currentText) return;

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentIndex < currentText.length) {
            setDisplayText((prev) => prev + currentText[currentIndex]);
            setCurrentIndex((prev) => prev + 1);
          } else if (loop) {
            setTimeout(() => setIsDeleting(true), delay);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText((prev) => prev.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentIndex(0);
            setTextArrayIndex((prev) => (prev + 1) % textArray.length);
          }
        }
      },
      isDeleting ? deleteSpeed : speed,
    );

    return () => clearTimeout(timeout);
  }, [
    currentIndex,
    isDeleting,
    currentText,
    loop,
    speed,
    deleteSpeed,
    delay,
    displayText,
    text,
    textArray.length,
  ]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">{cursor}</span>
    </span>
  );
}

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

// `accent` is this project's brand blue scale, so the upstream
// hover:bg-accent / text-accent-foreground pairs would paint a solid blue block
// instead of a subtle hover. They use `secondary` here, which is the same role.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input dark:border-input/50 bg-background hover:bg-secondary hover:text-secondary-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary hover:text-secondary-foreground",
        link: "text-foreground/70 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-6",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input dark:border-input/50 bg-background px-3 py-3 text-sm text-foreground shadow-sm shadow-black/5 transition-shadow placeholder:text-muted-foreground/70 focus-visible:bg-secondary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, ...props }, ref) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
    return (
      <div className="grid w-full items-center gap-2">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="relative">
          <Input id={id} type={showPassword ? "text" : "password"} className={cn("pe-10", className)} ref={ref} {...props} />
          <button type="button" onClick={togglePasswordVisibility} className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-muted-foreground/80 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? (<EyeOff className="size-4" aria-hidden="true" />) : (<Eye className="size-4" aria-hidden="true" />)}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { Button, Input, Label, PasswordInput, buttonVariants };

interface AuthContentProps {
  image?: {
    src: string;
    alt: string;
  };
  quote?: {
    text: string;
    author: string;
  };
}

export interface AuthUIProps {
  signInContent?: AuthContentProps;
  signUpContent?: AuthContentProps;
  /** Heading above the sign-in options. */
  title?: string;
  /** Supporting line under the heading. */
  subtitle?: string;
  /**
   * Rendered in place of the built-in Google button. Pass the real provider
   * widget here - the built-in one is a static mock that only logs to the
   * console, which must never ship as a working sign-in control.
   */
  googleSlot?: React.ReactNode;
  /**
   * The email-and-password form, rendered above the Google button. This is a
   * slot rather than a built-in form on purpose: the form has to talk to the
   * API, and a component that owns the markup but not the submit handler ends
   * up silently discarding what people type.
   */
  emailFormSlot?: React.ReactNode;
  /**
   * Which side of the form is showing. Only drives the artwork and the
   * heading - the slot owns the form itself.
   */
  mode?: "signin" | "signup";
  /** Heading used in place of `title` while `mode` is "signup". */
  signUpTitle?: string;
  /** Optional brand block above the heading. */
  brand?: React.ReactNode;
  /** Rendered under the sign-in options, e.g. an error message. */
  footer?: React.ReactNode;
  /** Classes for the left-hand panel, e.g. a tinted background. */
  formPanelClassName?: string;
  /** Classes for the block holding the sign-in options, e.g. a card. */
  formCardClassName?: string;
  /**
   * Fills the right-hand panel instead of the background image. The quote still
   * renders on top of it, so this is a backdrop rather than a replacement for
   * the whole panel.
   */
  asideSlot?: React.ReactNode;
  /**
   * Fills the ground behind the sign-in form. Like asideSlot this is a backdrop
   * rather than a replacement: the brand, card and footer all render on top of
   * it, so whatever goes here has to stay quiet enough to read a form over.
   */
  formBackgroundSlot?: React.ReactNode;
  /**
   * Drops the right-hand panel entirely and gives the form the whole viewport,
   * centred. The panel is decorative - the form never depended on it - so this
   * changes nothing but the layout.
   */
  hideAside?: boolean;
}

const defaultSignInContent = {
  image: {
    // Verified to resolve; the upstream defaults pointed at a third-party CDN.
    src: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1400&auto=format&fit=crop",
    alt: "A library of books, lit from the side",
  },
  quote: {
    text: "Welcome back. Pick up where you left off.",
    author: "V-Notes AI",
  },
};

const defaultSignUpContent = {
  image: {
    src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1400&auto=format&fit=crop",
    alt: "A blackboard covered in handwritten equations",
  },
  quote: {
    text: "Turn any video into notes worth keeping.",
    author: "V-Notes AI",
  },
};

export function AuthUI({
  signInContent = {},
  signUpContent = {},
  title = "Sign in to your account",
  subtitle = "Continue with Google to get started",
  googleSlot,
  emailFormSlot,
  mode = "signin",
  signUpTitle = "Create an account",
  brand,
  footer,
  asideSlot,
  formBackgroundSlot,
  formPanelClassName,
  formCardClassName,
  hideAside = false,
}: AuthUIProps) {
  const isSignIn = mode === "signin";

  const finalSignInContent = {
    image: { ...defaultSignInContent.image, ...signInContent.image },
    quote: { ...defaultSignInContent.quote, ...signInContent.quote },
  };
  const finalSignUpContent = {
    image: { ...defaultSignUpContent.image, ...signUpContent.image },
    quote: { ...defaultSignUpContent.quote, ...signUpContent.quote },
  };

  const currentContent = isSignIn ? finalSignInContent : finalSignUpContent;

  return (
    <div
      className={cn(
        "w-full min-h-screen bg-background",
        !hideAside && "md:grid md:grid-cols-2",
      )}
    >
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>
      <div
        className={cn(
          "relative flex min-h-screen items-center justify-center p-6",
          !hideAside && "md:min-h-0",
          formPanelClassName
        )}
      >
        {formBackgroundSlot ? (
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden="true"
          >
            {formBackgroundSlot}
          </div>
        ) : null}
        <div
          className={cn(
            "relative z-10 mx-auto grid gap-5",
            hideAside ? "w-full" : "w-[350px]",
            formCardClassName,
          )}
        >
          {brand}

          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {isSignIn ? title : signUpTitle}
            </h1>
            <p className="text-balance text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {emailFormSlot}

          {emailFormSlot && googleSlot ? (
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              {/* The label sits on the card, not the page, so it takes the
                  card's own translucent surface rather than `background`,
                  which would paint an opaque block over the backdrop. */}
              <span className="relative z-10 bg-paper-50/90 px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          ) : null}

          <div className="flex justify-center">{googleSlot}</div>

          {footer}
        </div>
      </div>

      {!hideAside && (
        <div
          className={cn(
            "hidden md:block relative overflow-hidden transition-all duration-500 ease-in-out",
            !asideSlot && "bg-cover bg-center"
          )}
          style={asideSlot ? undefined : { backgroundImage: `url(${currentContent.image.src})` }}
          role={asideSlot ? undefined : "img"}
          aria-label={asideSlot ? undefined : currentContent.image.alt}
          key={asideSlot ? "aside" : currentContent.image.src}
        >
          {asideSlot ? (
            <div className="absolute inset-0">{asideSlot}</div>
          ) : (
            <div className="absolute inset-0 bg-background/35" />
          )}
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 h-[160px] bg-gradient-to-t to-transparent",
              // An aside slot supplies its own dark artwork, so the fade has to
              // come off that rather than off the page surface, which may be white.
              asideSlot ? "from-[#06070a]" : "from-background"
            )}
          />
  
          <div className="relative z-10 flex h-full flex-col items-center justify-end p-2 pb-6">
            <blockquote
              className={cn(
                "space-y-2 text-center",
                asideSlot ? "text-white" : "text-foreground"
              )}
            >
              <p className="text-lg font-medium">
                “<Typewriter key={currentContent.quote.text} text={currentContent.quote.text} speed={60} />”
              </p>
              <cite
                className={cn(
                  "block text-sm font-light not-italic",
                  asideSlot ? "text-white/60" : "text-muted-foreground"
                )}
              >
                — {currentContent.quote.author}
              </cite>
            </blockquote>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuthUI;
