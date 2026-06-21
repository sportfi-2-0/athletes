import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { sports } from "@/constants/sports";
import { countries } from "@/constants/countries";

const authSchema = z
  .object({
    mode: z.enum(["login", "signup"]),
    email: z.string().email("Informe um e-mail válido."),
    password: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
    name: z.string().optional(),
    sport: z.string().optional(),
    birthDate: z.string().optional(),
    country: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode !== "signup") return;
    if (!data.name || data.name.trim().length < 2)
      ctx.addIssue({ path: ["name"], code: "custom", message: "Informe seu nome." });
    if (!data.sport)
      ctx.addIssue({ path: ["sport"], code: "custom", message: "Selecione um esporte." });
    if (!data.birthDate)
      ctx.addIssue({ path: ["birthDate"], code: "custom", message: "Informe sua data de nascimento." });
    if (!data.country)
      ctx.addIssue({ path: ["country"], code: "custom", message: "Selecione um país." });
  });

type AuthForm = z.infer<typeof authSchema>;

const defaultValues: AuthForm = {
  mode: "login",
  email: "",
  password: "",
  name: "",
  sport: "",
  birthDate: "",
  country: "",
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues,
  });

  const toggleMode = () => {
    const next = !isLogin;
    setIsLogin(next);
    reset({ ...defaultValues, mode: next ? "login" : "signup" });
  };

  const onSubmit = async (values: AuthForm) => {
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) throw error;
        navigate("/");
        return;
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });
      if (signUpError) throw signUpError;

      const newUser = signUpData.user;
      if (!newUser) {
        throw new Error("Conta criada, mas não foi possível obter os dados do usuário.");
      }

      const { error: profileError } = await supabase.from("profiles").insert({
        id: newUser.id,
        name: (values.name ?? "").trim(),
        sport: values.sport!,
        birth_date: values.birthDate!,
        country: values.country!,
      });

      if (profileError) {
        console.error("Profile insert failed:", profileError);
        await supabase.auth.signOut();
        throw new Error(
          "Conta criada, mas houve um erro ao salvar seu perfil. Tente novamente."
        );
      }

      toast.success("Conta criada com sucesso!");
      navigate("/");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao autenticar.";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              IRIS.ai — Marketing Esportivo
            </span>
          </div>
          <h1 className="font-display font-extrabold text-3xl mb-2">
            <span className="gradient-text">
              {isLogin ? "Entrar na sua conta" : "Criar sua conta"}
            </span>
          </h1>
          <p className="text-muted-foreground">
            {isLogin
              ? "Acesse seus roteiros e calendário"
              : "Comece a criar roteiros esportivos"}
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8 animate-slide-up">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground font-medium">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    className="h-12 bg-card border-border/50 focus:border-primary"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Esporte</Label>
                  <Controller
                    control={control}
                    name="sport"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
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
                    )}
                  />
                  {errors.sport && (
                    <p className="text-sm text-destructive">{errors.sport.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth-date" className="text-foreground font-medium">
                    Data de nascimento
                  </Label>
                  <Input
                    id="birth-date"
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    className="h-12 bg-card border-border/50 focus:border-primary"
                    {...register("birthDate")}
                  />
                  {errors.birthDate && (
                    <p className="text-sm text-destructive">{errors.birthDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground font-medium">País</Label>
                  <Controller
                    control={control}
                    name="country"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-12 bg-card border-border/50 focus:border-primary">
                          <SelectValue placeholder="Selecione o seu país" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.country && (
                    <p className="text-sm text-destructive">{errors.country.message}</p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="h-12 bg-card border-border/50 focus:border-primary"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-12 bg-card border-border/50 focus:border-primary"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="xl"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Carregando..." : isLogin ? "Entrar" : "Cadastrar"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin
                ? "Não tem conta? Cadastre-se"
                : "Já tem conta? Faça login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
