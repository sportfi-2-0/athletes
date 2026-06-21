import { cn } from "@/lib/utils";

interface LogoProps {
  /** Size of the logomark in pixels. */
  size?: number;
  /** Show the "IRIS.ai" wordmark next to the mark. */
  withWordmark?: boolean;
  className?: string;
}

/**
 * Brand logo. Single swap point for the IRIS mark across nav, auth and splash —
 * replacing /public/logo.png updates it everywhere.
 */
export function Logo({ size = 28, withWordmark = false, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img
        src="/logo.png"
        alt="IRIS.ai"
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
      />
      {withWordmark && (
        <span className="font-display font-bold text-sm text-foreground">
          IRIS.ai
        </span>
      )}
    </span>
  );
}
