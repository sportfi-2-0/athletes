import { useState, useEffect } from "react";
import { ScriptForm, FormData } from "@/components/ScriptForm";
import { ScriptResults } from "@/components/ScriptResults";
import { Script } from "@/components/ScriptCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";

const Index = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [defaultSport, setDefaultSport] = useState<string | undefined>(undefined);

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
    setFormData(data);

    try {
      const { data: result, error } = await supabase.functions.invoke("generate-scripts", {
        body: data,
      });

      if (error) {
        console.error("Error generating scripts:", error);
        toast.error("Erro ao gerar roteiros. Tente novamente.");
        return;
      }

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      setScripts(result.scripts);
    } catch (error) {
      console.error("Error:", error);
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
          {scripts.length > 0 && (
            <ScriptResults
              scripts={scripts}
              onRegenerate={handleRegenerate}
              isLoading={isLoading}
            />
          )}
        </main>
      </div>
    </AppLayout>
  );
};

export default Index;