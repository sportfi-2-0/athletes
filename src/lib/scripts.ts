import { supabase } from "@/integrations/supabase/client";
import type { Script } from "@/components/ScriptCard";
import type { FormData } from "@/components/ScriptForm";

/** A script persisted in the database (`id` is the DB uuid). */
export interface SavedScript extends Script {
  sport?: string;
  format?: string;
  description?: string;
  tones?: string[];
  createdAt?: string;
}

/** Persist a generated script together with the context that produced it. */
export async function saveScript(script: Script, context: FormData) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Você precisa estar logado para salvar roteiros.");

  const { error } = await supabase.from("scripts").insert({
    user_id: user.id,
    title: script.title,
    content: script.content,
    note: script.note || null,
    art_template: script.artTemplate ?? null,
    caption: script.caption ?? null,
    sport: context.sport,
    format: context.format,
    description: context.description,
    tones: context.tones,
  });
  if (error) throw error;
}

/** List the current user's saved scripts, newest first. */
export async function fetchScripts(): Promise<SavedScript[]> {
  const { data, error } = await supabase
    .from("scripts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    content: Array.isArray(row.content) ? (row.content as string[]) : [],
    note: row.note ?? "",
    artTemplate: row.art_template ?? undefined,
    caption: row.caption ?? undefined,
    sport: row.sport ?? undefined,
    format: row.format ?? undefined,
    description: row.description ?? undefined,
    tones: Array.isArray(row.tones) ? (row.tones as string[]) : undefined,
    createdAt: row.created_at,
  }));
}

export async function deleteScript(id: string) {
  const { error } = await supabase.from("scripts").delete().eq("id", id);
  if (error) throw error;
}
