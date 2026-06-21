import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarIcon, Clock, Plus, Trash2, Pencil, CalendarPlus, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ScriptForm, FormData } from "@/components/ScriptForm";
import { ScriptCard, Script } from "@/components/ScriptCard";

interface Post {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  title: string | null;
  content: string;
}

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("12:00");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [contentMode, setContentMode] = useState<"manual" | "ai" | "">("");
  const [generatedScripts, setGeneratedScripts] = useState<Script[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [defaultSport, setDefaultSport] = useState<string | undefined>(undefined);
  const [pendingScript, setPendingScript] = useState<Script | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("id, scheduled_date, scheduled_time, title, content")
      .order("scheduled_date", { ascending: true });
    if (data) setPosts(data);
  };

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
    fetchPosts();
  }, []);

  // A script can arrive from "Agendar" (Roteiros / Meus Roteiros) via router state.
  useEffect(() => {
    const incoming = (location.state as { script?: Script } | null)?.script;
    if (incoming) {
      setPendingScript(incoming);
      // Clear router state so a refresh doesn't re-trigger the scheduling flow.
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const scriptToContent = (script: Script) =>
    `${script.title}\n\n${script.content.join("\n\n")}\n\n💡 ${script.note}`;

  const openScheduleForScript = (script: Script, day: Date) => {
    setEditingPostId(null);
    setTitle(script.title);
    setTime("12:00");
    setContent(scriptToContent(script));
    setContentMode("manual");
    setGeneratedScripts([]);
    setSelectedScript(null);
    setSelectedDate(day);
    setDialogOpen(true);
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    if (pendingScript) {
      openScheduleForScript(pendingScript, day);
    }
  };

  const openNewPostDialog = () => {
    setEditingPostId(null);
    setTitle("");
    setTime("12:00");
    setContent("");
    setContentMode("");
    setGeneratedScripts([]);
    setSelectedScript(null);
    setDialogOpen(true);
  };

  const openEditPostDialog = (post: Post) => {
    setEditingPostId(post.id);
    setTitle(post.title || "");
    setTime(post.scheduled_time.slice(0, 5));
    setContent(post.content);
    setContentMode("manual");
    setGeneratedScripts([]);
    setSelectedScript(null);
    setDialogOpen(true);
  };

  const handleGenerateScripts = async (data: FormData) => {
    setIsGenerating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-scripts", {
        body: data,
      });

      if (error) {
        toast.error("Erro ao gerar roteiros. Tente novamente.");
        return;
      }
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      setGeneratedScripts(result.scripts);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar roteiros. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedDate || !content.trim()) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado.");
      setSaving(false);
      return;
    }

    if (editingPostId) {
      const { error } = await supabase.from("posts").update({
        scheduled_date: format(selectedDate, "yyyy-MM-dd"),
        scheduled_time: time,
        title: title.trim() || null,
        content: content.trim(),
      }).eq("id", editingPostId);

      if (error) {
        toast.error("Erro ao atualizar post.");
      } else {
        toast.success("Post atualizado!");
        setDialogOpen(false);
        setEditingPostId(null);
        fetchPosts();
      }
    } else {
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        scheduled_date: format(selectedDate, "yyyy-MM-dd"),
        scheduled_time: time,
        title: title.trim() || null,
        content: content.trim(),
      });

      if (error) {
        toast.error("Erro ao salvar post.");
      } else {
        toast.success("Post agendado!");
        setDialogOpen(false);
        setPendingScript(null);
        fetchPosts();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir post.");
    } else {
      toast.success("Post excluído.");
      fetchPosts();
    }
  };

  const postDates = posts.map((p) => new Date(p.scheduled_date + "T00:00:00"));
  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const postsForDate = posts.filter((p) => p.scheduled_date === selectedDateStr);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl mb-2">
          <span className="gradient-text">Calendário de Conteúdo</span>
        </h1>
        <p className="text-muted-foreground mb-8">
          Clique em um dia para agendar um post.
        </p>

        {pendingScript && (
          <div className="glass-card rounded-2xl p-4 mb-6 flex items-center gap-3 animate-fade-in">
            <CalendarPlus className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-foreground flex-1">
              Selecione um dia no calendário para agendar{" "}
              <strong>{pendingScript.title}</strong>.
            </p>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cancelar agendamento"
              onClick={() => setPendingScript(null)}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="grid md:grid-cols-[auto_1fr] gap-8">
          <div className="glass-card rounded-3xl p-4 sm:p-6 self-start">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(day) => day && handleDayClick(day)}
              locale={ptBR}
              className="pointer-events-auto"
              modifiers={{ hasPost: postDates }}
              modifiersClassNames={{
                hasPost: "bg-primary/20 font-bold text-primary",
              }}
            />
          </div>

          <div className="space-y-4">
            {selectedDate && (
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-xl text-foreground">
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </h2>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={openNewPostDialog}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Novo post
                </Button>
              </div>
            )}

            {!selectedDate && (
              <div className="glass-card rounded-2xl p-8 text-center">
                <CalendarIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Selecione um dia no calendário para ver ou criar posts.
                </p>
              </div>
            )}

            {selectedDate && postsForDate.length === 0 && (
              <div className="glass-card rounded-2xl p-6 text-center">
                <p className="text-muted-foreground">
                  Nenhum post agendado para este dia.
                </p>
              </div>
            )}

            {postsForDate.map((post) => (
              <div
                key={post.id}
                className="glass-card rounded-2xl p-5 animate-fade-in"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    {post.title && (
                      <h3 className="font-display font-bold text-foreground mb-1">
                        {post.title}
                      </h3>
                    )}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                      <Clock className="w-3.5 h-3.5" />
                      {post.scheduled_time.slice(0, 5)}
                    </div>
                    <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditPostDialog(post)}
                      aria-label="Editar post"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Excluir post"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir post?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O post agendado
                            {post.title ? ` "${post.title}"` : ""} será removido
                            permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(post.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingPostId ? "Editar Post" : "Agendar Post"}
            </DialogTitle>
            <DialogDescription>
              {selectedDate &&
                format(selectedDate, "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">
                Título (opcional)
              </Label>
              <Input
                placeholder="Ex: Post de treino"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 bg-card border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">
                Horário do post
              </Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-11 bg-card border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">
                Tipo de conteúdo
              </Label>
              <Select
                value={contentMode}
                onValueChange={(value: "manual" | "ai") => {
                  setContentMode(value);
                  setContent("");
                  setGeneratedScripts([]);
                  setSelectedScript(null);
                }}
              >
                <SelectTrigger className="h-11 bg-card border-border/50">
                  <SelectValue placeholder="Selecione como criar o conteúdo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Inserir roteiro pronto</SelectItem>
                  <SelectItem value="ai">Gerar roteiro com IA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {contentMode === "manual" && (
              <div className="space-y-2">
                <Label className="text-foreground font-medium">
                  Roteiro / Conteúdo
                </Label>
                <Textarea
                  placeholder="Cole aqui o roteiro gerado ou escreva o conteúdo do post..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[120px] bg-card border-border/50 resize-none"
                />
              </div>
            )}

            {contentMode === "ai" && !selectedScript && (
              <div className="space-y-4">
                <ScriptForm
                  key={defaultSport ?? "no-default"}
                  onSubmit={handleGenerateScripts}
                  isLoading={isGenerating}
                  defaultSport={defaultSport}
                />

                {generatedScripts.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-foreground font-medium">
                      Selecione um roteiro para agendar:
                    </Label>
                    {generatedScripts.map((script, index) => (
                      <div
                        key={script.id}
                        className="cursor-pointer transition-all hover:ring-2 hover:ring-primary rounded-2xl"
                        onClick={() => {
                          setSelectedScript(script);
                          const fullContent = `${script.title}\n\n${script.content.join("\n\n")}\n\n💡 ${script.note}`;
                          setContent(fullContent);
                        }}
                      >
                        <ScriptCard script={script} index={index} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {contentMode === "ai" && selectedScript && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground font-medium">
                    Roteiro selecionado
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedScript(null);
                      setContent("");
                    }}
                    className="text-muted-foreground"
                  >
                    Trocar roteiro
                  </Button>
                </div>
                <div className="glass-card rounded-2xl p-4">
                  <h4 className="font-display font-bold text-sm text-foreground mb-2">
                    {selectedScript.title}
                  </h4>
                  <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-line line-clamp-4">
                    {selectedScript.content.join("\n")}
                  </p>
                </div>
              </div>
            )}

            {contentMode && (
              <Button
                variant="gradient"
                size="lg"
                className="w-full"
                onClick={handleSave}
                disabled={saving || !content.trim()}
              >
                {saving ? "Salvando..." : editingPostId ? "Salvar alterações" : "Agendar post"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default CalendarPage;