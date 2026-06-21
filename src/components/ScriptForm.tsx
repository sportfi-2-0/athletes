import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { sports } from "@/constants/sports";

const tones = [
  { id: "informativo", label: "Informativo" },
  { id: "pessoal", label: "Pessoal / Humanizado" },
  { id: "educativo", label: "Educativo" },
  { id: "trend", label: "Trend / Viral" },
  { id: "institucional", label: "Institucional" },
  { id: "conversa", label: "Conversa direta" },
  { id: "inspiracional", label: "Inspiracional" },
];

const formats = [
  { value: "reel", label: "Reel" },
  { value: "carrossel", label: "Carrossel" },
  { value: "story", label: "Story" },
  { value: "estatico", label: "Estático" },
];

export interface FormData {
  sport: string;
  format: string;
  description: string;
  tones: string[];
}

interface ScriptFormProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
  defaultSport?: string;
}

export function ScriptForm({ onSubmit, isLoading, defaultSport }: ScriptFormProps) {
  const [formData, setFormData] = useState<FormData>({
    sport: defaultSport ?? "",
    format: "",
    description: "",
    tones: [],
  });

  const handleToneToggle = (toneId: string) => {
    setFormData((prev) => ({
      ...prev,
      tones: prev.tones.includes(toneId)
        ? prev.tones.filter((t) => t !== toneId)
        : [...prev.tones, toneId],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isValid =
    formData.sport &&
    formData.format &&
    formData.description &&
    formData.tones.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="sport" className="text-foreground font-medium">
          Esporte
        </Label>
        <Select
          value={formData.sport}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, sport: value }))
          }
        >
          <SelectTrigger className="h-12 bg-card border-border/50 focus:border-primary">
            <SelectValue placeholder="Selecione o seu esporte" />
          </SelectTrigger>
          <SelectContent>
            {sports.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="format" className="text-foreground font-medium">
          Formato da postagem
        </Label>
        <Select
          value={formData.format}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, format: value }))
          }
        >
          <SelectTrigger className="h-12 bg-card border-border/50 focus:border-primary">
            <SelectValue placeholder="Selecione o formato" />
          </SelectTrigger>
          <SelectContent>
            {formats.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-foreground font-medium">
          Descrição da postagem
        </Label>
        <Textarea
          id="description"
          placeholder="Ex: mostrar rotina de treino, divulgar patrocínio, compartilhar bastidores de competição, motivar seguidores…"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          className="min-h-[100px] bg-card border-border/50 focus:border-primary transition-colors resize-none"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-foreground font-medium">Tom de comunicação</Label>
        <div className="flex flex-wrap gap-2">
          {tones.map((tone) => {
            const selected = formData.tones.includes(tone.id);
            return (
              <button
                key={tone.id}
                type="button"
                aria-pressed={selected}
                onClick={() => handleToneToggle(tone.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  selected
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {tone.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-4">
        <Button
          type="submit"
          variant="gradient"
          size="xl"
          className="w-full"
          disabled={!isValid || isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Gerando...
            </span>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Gerar sugestões de roteiro
            </>
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-3">
          As sugestões servem como base para criação e personalização do seu conteúdo.
        </p>
      </div>
    </form>
  );
}