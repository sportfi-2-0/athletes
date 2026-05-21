import { Button } from "@/components/ui/button";
import { ScriptCard, Script } from "@/components/ScriptCard";
import { RefreshCw } from "lucide-react";

interface ScriptResultsProps {
  scripts: Script[];
  onRegenerate: () => void;
  isLoading: boolean;
}

export function ScriptResults({ scripts, onRegenerate, isLoading }: ScriptResultsProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-2xl text-foreground">
          Sugestões de Roteiro
        </h2>
        <Button
          variant="gradient-outline"
          onClick={onRegenerate}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Gerar novas sugestões
        </Button>
      </div>

      <div className="grid gap-4">
        {scripts.map((script, index) => (
          <ScriptCard key={script.id} script={script} index={index} />
        ))}
      </div>
    </div>
  );
}