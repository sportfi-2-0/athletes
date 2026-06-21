import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ScriptForm, FormData } from "@/components/ScriptForm";
import { ScriptResults } from "@/components/ScriptResults";
import { Script } from "@/components/ScriptCard";
import { supabase } from "@/integrations/supabase/client";
import { saveScript } from "@/lib/scripts";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";

const Index = () => {
  const navigate = useNavigate();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [defaultSport, setDefaultSport] = useState<string | undefined>(undefined);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Fetch the current user's sport from their profile on mount.
  useEffect(() => {
    const fetchProfileSport = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("sport")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to load profile:", error);
        return;
      }
      if (profile?.sport) {
        setDefaultSport(profile.sport);
      }
    };

    fetchProfileSport();
  }, []);

  const handleGenerate = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    setFormData(data);
    setScripts([]);
    setSavedIds([]);

    try {
      const { data: result, error } = await supabase.functions.invoke("generate-scripts", {
        body: data,
      });

      if (error) {
        console.error("Error generating scripts:", error);
        setError("Erro ao gerar roteiros. Tente novamente.");
        toast.error("Erro ao gerar roteiros. Tente novamente.");
        return;
      }

      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      setScripts(result.scripts);
    } catch (error) {
      console.error("Error:", error);
      setError("Erro ao gerar roteiros. Tente novamente.");
      toast.error("Erro ao gerar roteiros. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (formData) {
      await handleGenerate(formData);
    }
  };

  const handleSave = async (script: Script) => {
    if (!formData) return;
    setSavingId(script.id);
    try {
      await saveScript(script, formData);
      setSavedIds((prev) => [...prev, script.id]);
      toast.success("Roteiro salvo em Meus Roteiros!");
    } catch (err) {
      console.error("Failed to save script:", err);
      toast.error("Não foi possível salvar o roteiro. Tente novamente.");
    } finally {
      setSavingId(null);
    }
  };

  const handleSchedule = (script: Script) => {
    navigate("/calendario", { state: { script } });
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10 animate-fade-in">
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl mb-4">
            <span className="gradient-text">Crie roteiros de conteúdo</span>
            <br />
            para o seu esporte
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Monte roteiros de marketing esportivo em poucos cliques e fortaleça sua marca pessoal como atleta.
          </p>
        </header>

        {/* Main Content */}
        <main className="space-y-10">
          {/* Form Card */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 animate-slide-up">
            <ScriptForm
              key={defaultSport ?? "no-default"}
              onSubmit={handleGenerate}
              isLoading={isLoading}
              defaultSport={defaultSport}
            />
          </div>

          {/* Results */}
          {(isLoading || scripts.length > 0 || error) && (
            <ScriptResults
              scripts={scripts}
              onRegenerate={handleRegenerate}
              isLoading={isLoading}
              error={error}
              onSave={handleSave}
              savedIds={savedIds}
              savingId={savingId}
              onSchedule={handleSchedule}
            />
          )}
        </main>
      </div>
    </AppLayout>
  );
};

export default Index;
