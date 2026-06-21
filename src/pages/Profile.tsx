import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
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
import { Skeleton } from "@/components/ui/skeleton";
import { sports } from "@/constants/sports";
import { countries } from "@/constants/countries";
import { toast } from "sonner";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome."),
  sport: z.string().min(1, "Selecione um esporte."),
  birthDate: z.string().min(1, "Informe sua data de nascimento."),
  country: z.string().min(1, "Selecione um país."),
});

type ProfileForm = z.infer<typeof profileSchema>;

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", sport: "", birthDate: "", country: "" },
  });

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("name, sport, birth_date, country")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to load profile:", error);
        toast.error("Não foi possível carregar seu perfil.");
      } else if (profile) {
        reset({
          name: profile.name ?? "",
          sport: profile.sport ?? "",
          birthDate: profile.birth_date ?? "",
          country: profile.country ?? "",
        });
      }
      setLoading(false);
    };

    load();
  }, [reset]);

  const onSubmit = async (values: ProfileForm) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        name: values.name.trim(),
        sport: values.sport,
        birth_date: values.birthDate,
        country: values.country,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Failed to update profile:", error);
      toast.error("Erro ao salvar o perfil. Tente novamente.");
      return;
    }
    toast.success("Perfil atualizado!");
  };

  return (
    <AppLayout>
      <div className="max-w-md mx-auto">
        <header className="mb-8">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl mb-2">
            <span className="gradient-text">Meu Perfil</span>
          </h1>
          <p className="text-muted-foreground">
            Atualize seus dados de atleta.
          </p>
        </header>

        <div className="glass-card rounded-3xl p-6 sm:p-8 animate-slide-up">
          {loading ? (
            <div className="space-y-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  E-mail
                </Label>
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="h-12 bg-muted border-border/50"
                />
                <p className="text-xs text-muted-foreground">
                  O e-mail de acesso não pode ser alterado por aqui.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground font-medium">
                  Nome
                </Label>
                <Input
                  id="name"
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

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Salvar alterações"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
