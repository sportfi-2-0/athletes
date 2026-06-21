import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { ArrowLeft, MailCheck } from "lucide-react";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);
    if (error) {
      console.error("resetPasswordForEmail failed:", error);
      toast.error("Não foi possível enviar o e-mail. Tente novamente.");
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <Logo size={64} className="justify-center mb-4" />
          <h1 className="font-display font-extrabold text-3xl mb-2">
            <span className="gradient-text">Redefinir senha</span>
          </h1>
          <p className="text-muted-foreground">
            Enviaremos um link para você criar uma nova senha.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8 animate-slide-up">
          {sent ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent mb-4">
                <MailCheck className="w-6 h-6 text-primary" />
              </div>
              <p className="text-foreground font-medium mb-2">Verifique seu e-mail</p>
              <p className="text-sm text-muted-foreground mb-6">
                Se existe uma conta com <strong>{email}</strong>, enviamos um link
                para redefinir a senha.
              </p>
              <Button variant="gradient" className="w-full" onClick={() => navigate("/auth")}>
                Voltar para o login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-card border-border/50 focus:border-primary"
                  required
                />
              </div>
              <Button
                type="submit"
                variant="gradient"
                size="xl"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar link"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para o login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
