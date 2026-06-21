import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Eye, EyeOff } from "lucide-react";

const resetSchema = z
  .object({
    password: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "As senhas não coincidem.",
  });

type ResetForm = z.infer<typeof resetSchema>;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirm: "" },
  });

  // The recovery link establishes a session (supabase-js reads it from the URL).
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession((prev) => prev ?? !!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (values: ResetForm) => {
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      console.error("updateUser password failed:", error);
      toast.error("Não foi possível redefinir a senha. O link pode ter expirado.");
      return;
    }
    toast.success("Senha redefinida com sucesso!");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <Logo size={64} className="justify-center mb-4" />
          <h1 className="font-display font-extrabold text-3xl mb-2">
            <span className="gradient-text">Nova senha</span>
          </h1>
          <p className="text-muted-foreground">Crie uma nova senha para sua conta.</p>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8 animate-slide-up">
          {hasSession === false ? (
            <div className="text-center">
              <p className="text-muted-foreground mb-6">
                Link inválido ou expirado. Solicite um novo link para redefinir a senha.
              </p>
              <Button variant="gradient" className="w-full" onClick={() => navigate("/esqueci-senha")}>
                Solicitar novo link
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">
                  Nova senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-12 bg-card border-border/50 focus:border-primary pr-11"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-foreground font-medium">
                  Confirmar senha
                </Label>
                <Input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-12 bg-card border-border/50 focus:border-primary"
                  {...register("confirm")}
                />
                {errors.confirm && (
                  <p className="text-sm text-destructive">{errors.confirm.message}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="gradient"
                size="xl"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Redefinir senha"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
