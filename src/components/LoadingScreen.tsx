import { Sparkles, Loader2 } from "lucide-react";

/**
 * Branded full-screen loading state. Used while auth state resolves so the
 * user sees the IRIS identity instead of a blank white flash.
 */
export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <div className="flex items-center gap-2 animate-fade-in">
        <Sparkles className="w-6 h-6 text-primary" />
        <span className="font-display font-extrabold text-2xl">
          <span className="gradient-text">IRIS.ai</span>
        </span>
      </div>
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );
}
