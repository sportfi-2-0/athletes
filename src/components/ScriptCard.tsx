import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Palette } from "lucide-react";

export interface Script {
  id: string;
  title: string;
  content: string[];
  note: string;
  artTemplate?: string;
  caption?: string;
}

interface ScriptCardProps {
  script: Script;
  index: number;
}

export function ScriptCard({ script, index }: ScriptCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    let text = `${script.title}\n\n${script.content.join("\n\n")}`;
    if (script.caption) text += `\n\n📝 Legenda:\n${script.caption}`;
    if (script.artTemplate) text += `\n\n🎨 Template de arte:\n${script.artTemplate}`;
    text += `\n\n${script.note}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="glass-card rounded-2xl p-6 animate-slide-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <h3 className="font-display font-bold text-lg text-foreground">
          {script.title}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-success" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copiar
            </>
          )}
        </Button>
      </div>

      <div className="space-y-3 mb-4">
        {script.content.map((line, i) => (
          <p key={i} className="text-foreground/90 leading-relaxed">
            {line}
          </p>
        ))}
      </div>

      {script.artTemplate && (
        <div className="mb-4 p-4 rounded-xl bg-accent/50 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-4 h-4 text-primary" />
            <span className="font-display font-semibold text-sm text-foreground">
              Sugestão de Arte
            </span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
            {script.artTemplate}
          </p>
        </div>
      )}

      {script.caption && (
        <div className="mb-4 p-4 rounded-xl bg-muted border border-border/50">
          <span className="font-display font-semibold text-sm text-foreground block mb-2">
            📝 Legenda sugerida
          </span>
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
            {script.caption}
          </p>
        </div>
      )}

      <p className="text-sm text-muted-foreground italic border-t border-border pt-4">
        💡 {script.note}
      </p>
    </div>
  );
}