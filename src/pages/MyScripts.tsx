import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ScriptCard, Script } from "@/components/ScriptCard";
import { ScriptCardSkeleton } from "@/components/ScriptCardSkeleton";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { fetchScripts, deleteScript, type SavedScript } from "@/lib/scripts";
import { toast } from "sonner";
import { FileText, Trash2, Sparkles } from "lucide-react";

const MyScripts = () => {
  const navigate = useNavigate();
  const [scripts, setScripts] = useState<SavedScript[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setScripts(await fetchScripts());
    } catch (err) {
      console.error("Failed to load scripts:", err);
      toast.error("Não foi possível carregar seus roteiros.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteScript(id);
      setScripts((prev) => prev.filter((s) => s.id !== id));
      toast.success("Roteiro excluído.");
    } catch (err) {
      console.error("Failed to delete script:", err);
      toast.error("Erro ao excluir roteiro.");
    }
  };

  const handleSchedule = (script: Script) => {
    navigate("/calendario", { state: { script } });
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl mb-2">
            <span className="gradient-text">Meus Roteiros</span>
          </h1>
          <p className="text-muted-foreground">
            Os roteiros que você salvou. Agende ou copie quando quiser.
          </p>
        </header>

        {loading ? (
          <div className="grid gap-4">
            <ScriptCardSkeleton />
            <ScriptCardSkeleton />
          </div>
        ) : scripts.length === 0 ? (
          <div className="glass-card rounded-3xl p-10 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display font-bold text-lg text-foreground mb-2">
              Nenhum roteiro salvo ainda
            </h2>
            <p className="text-muted-foreground mb-6">
              Gere roteiros e toque em “Salvar” para guardá-los aqui.
            </p>
            <Button variant="gradient" onClick={() => navigate("/")} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Criar roteiro
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {scripts.map((script, index) => (
              <ScriptCard
                key={script.id}
                script={script}
                index={index}
                onSchedule={() => handleSchedule(script)}
                extraActions={
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Excluir roteiro"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir roteiro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. O roteiro “{script.title}”
                          será removido permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(script.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                }
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default MyScripts;
