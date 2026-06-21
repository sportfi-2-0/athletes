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
import { CalendarIcon, Clock, Plus, Trash2, Pencil, CalendarPlus, X, ListChecks } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ScriptForm, FormData } from "@/components/ScriptForm";
import { ScriptCard, Script } from "@/components/ScriptCard";
import { cn } from "@/lib/utils";

interface Post {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  title: string | null;
  content: string;
}

const todayStr = () => format(new Date(), "yyyy-MM-dd");
const dateLabel = (d: string) =>
  format(new Date(d + "T00:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR });

const CalendarPage = () => {
  const [view, setView] = useState<"calendar" | "agenda">("calendar");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dialogDate, setDialogDate] = useState("");
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
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true });
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
      setView("calendar");
      // Clear router state so a refresh doesn't re-trigger the scheduling flow.
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const scriptToContent = (script: Script) =>
    `${script.title}\n\n${script.content.join("\n\n")}\n\n💡 ${script.note}`;

  const resetDialogFields = () => {
    setEditingPostId(null);
    setTitle("");
    setTime("12:00");
    setContent("");
    setContentMode("");
    setGeneratedScripts([]);
    setSelectedScript(null);
  };

  const openScheduleForScript = (script: Script, day: Date) => {
    resetDialogFields();
    setTitle(script.title);
    setContent(scriptToContent(script));
    setContentMode("manual");
    setDialogDate(format(day, "yyyy-MM-dd"));
    setSelectedDate(day);
    setDialogOpen(true);
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    if (pendingScript) {
      openScheduleForScript(pendingScript, day);
    }
  };

  const openNewPostDialog = (date?: Date) => {
    resetDialogFields();
    setDialogDate(format(date ?? selectedDate ?? new Date(), "yyyy-MM-dd"));
    setDialogOpen(true);
  };

  const openEditPostDialog = (post: Post) => {
    resetDialogFields();
    setEditingPostId(post.id);
    setTitle(post.title || "");
    setDialogDate(post.scheduled_date);
    setTime(post.scheduled_time.slice(0, 5));
    setContent(post.content);
    setContentMode("manual");
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
    if (!dialogDate || !content.trim()) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado.");
      setSaving(false);
      return;
    }

    if (editingPostId) {
      const { error } = await supabase.from("posts").update({
        scheduled_date: dialogDate,
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
        scheduled_date: dialogDate,
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

  // Agenda view: upcoming posts (today onward) grouped by date.
  const today = todayStr();
  const upcoming = posts.filter((p) => p.scheduled_date >= today);
  const groupedUpcoming = upcoming.reduce<Record<string, Post[]>>((acc, p) => {
    (acc[p.scheduled_date] ??= []).push(p);
    return acc;
  }, {});

  const renderPostCard = (post: Post) => (
    <div key={post.id} className="glass-card rounded-2xl p-5 animate-fade-in">
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
  );

  const dialogDateLabel = dialogDate
    ? format(new Date(dialogDate + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "";

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl mb-2">
          <span className="gradient-text">Calendário de Conteúdo</span>
        </h1>
        <p className="text-muted-foreground mb-6">
          Planeje e agende seus posts.
        </p>

        {/* View toggle */}
        <div className="inline-flex rounded-lg border border-border/50 p-1 bg-card/60 mb-6">
          {([
            { id: "calendar", label: "Calendário", icon: CalendarIcon },
            { id: "agenda", label: "Agenda", icon: ListChecks },
          ] as const).map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                view === v.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <v.icon className="w-4 h-4" />
              {v.label}
            </button>
          ))}
        </div>

        {pendingScript && (
          <div className="glass-card rounded-2xl p-4 mb-6 flex items-center gap-3 animate-fade-in">
            <CalendarPlus className="w-5 h-5 text-secondary shrink-0" />
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

        {view === "calendar" ? (
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
                  hasPost: "bg-secondary/15 font-bold text-secondary",
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
                    onClick={() => openNewPostDialog()}
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

              {postsForDate.map(renderPostCard)}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl text-foreground">
                Próximos posts
              </h2>
              <Button
                variant="gradient"
                size="sm"
                onClick={() => openNewPostDialog(new Date())}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Novo post
              </Button>
            </div>

            {upcoming.length === 0 ? (
              <div className="glass-card rounded-2xl p-10 text-center">
                <ListChecks className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Nenhum post agendado para os próximos dias.
                </p>
              </div>
            ) : (
              Object.entries(groupedUpcoming).map(([date, datePosts]) => (
                <div key={date} className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-secondary">
                    {dateLabel(date)}
                  </h3>
                  {datePosts.map(renderPostCard)}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingPostId ? "Editar Post" : "Agendar Post"}
            </DialogTitle>
            <DialogDescription>
              {dialogDateLabel}
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Data</Label>
                <Input
                  type="date"
                  value={dialogDate}
                  onChange={(e) => setDialogDate(e.target.value)}
                  className="h-11 bg-card border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Horário</Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-11 bg-card border-border/50"
                />
              </div>
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
                          setContent(scriptToContent(script));
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
