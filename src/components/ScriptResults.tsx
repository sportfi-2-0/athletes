import { Button } from "@/components/ui/button";
import { ScriptCard, Script } from "@/components/ScriptCard";
import { ScriptCardSkeleton } from "@/components/ScriptCardSkeleton";
import { RefreshCw, AlertCircle } from "lucide-react";

interface ScriptResultsProps {
  scripts: Script[];
  onRegenerate: () => void;
  isLoading: boolean;
  error?: string | null;
  onSave?: (script: Script) => void;
  savedIds?: string[];
  savingId?: string | null;
  onSchedule?: (script: Script) => void;
}

export function ScriptResults({
  scripts,
  onRegenerate,
  isLoading,
  error,
  onSave,
  savedIds = [],
  savingId,
  onSchedule,
}: ScriptResultsProps) {
  const showSkeletons = isLoading && scripts.length === 0;
  const showError = !isLoading && !!error && scripts.length === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-2xl text-foreground">
          Sugestões de Roteiro
        </h2>
        {scripts.length > 0 && (
          <Button
            variant="gradient-outline"
            onClick={onRegenerate}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Gerar novas sugestões
          </Button>
        )}
      </div>

      {showError && (
        <div className="glass-card rounded-2xl p-8 text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="text-muted-foreground mb-5">{error}</p>
          <Button variant="gradient-outline" onClick={onRegenerate} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Tentar de novo
          </Button>
        </div>
      )}

      <div className="grid gap-4">
        {showSkeletons
          ? Array.from({ length: 3 }).map((_, i) => <ScriptCardSkeleton key={i} />)
          : scripts.map((script, index) => (
              <ScriptCard
                key={script.id}
                script={script}
                index={index}
                onSave={onSave ? () => onSave(script) : undefined}
                saved={savedIds.includes(script.id)}
                saving={savingId === script.id}
                onSchedule={onSchedule ? () => onSchedule(script) : undefined}
              />
            ))}
      </div>
    </div>
  );
}
