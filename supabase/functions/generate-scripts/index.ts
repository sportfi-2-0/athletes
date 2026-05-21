// Edge function: generate-scripts
// Runs on Supabase's Deno runtime. Called from the frontend via supabase.functions.invoke("generate-scripts", { body: {...} }).
// Generates 3 social media script suggestions for athletes using Gemini 2.5 Flash.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ScriptRequest {
  sport: string;
  format: string;
  description: string;
  tones: string[];
}

const toneLabels: Record<string, string> = {
  informativo: "informativo",
  pessoal: "pessoal e humanizado",
  educativo: "educativo",
  trend: "viral e tendência",
  institucional: "institucional",
  conversa: "conversacional",
  inspiracional: "inspiracional",
};

const sportLabels: Record<string, string> = {
  futebol: "Futebol",
  basquete: "Basquete",
  volei: "Vôlei",
  natacao: "Natação",
  atletismo: "Atletismo",
  tenis: "Tênis",
  "mma-luta": "MMA / Lutas",
  "jiu-jitsu": "Jiu-Jitsu",
  crossfit: "CrossFit",
  musculacao: "Musculação / Bodybuilding",
  ciclismo: "Ciclismo",
  corrida: "Corrida",
  surfe: "Surfe",
  skate: "Skate",
  ginastica: "Ginástica",
  handebol: "Handebol",
  futsal: "Futsal",
  boxe: "Boxe",
  esgrima: "Esgrima",
  esports: "eSports",
  triathlon: "Triathlon",
  "polo-aquatico": "Polo Aquático",
  rugby: "Rugby",
  golf: "Golf",
  outro: "Outro",
};

const formatLabels: Record<string, string> = {
  reel: "Reels (vídeo curto vertical)",
  carrossel: "Carrossel (múltiplos slides)",
  story: "Stories (sequência de stories)",
  estatico: "Post estático (imagem única no feed)",
};

const GEMINI_MODEL = "gemini-2.5-flash";

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const { sport, format, description, tones }: ScriptRequest = await req.json();

    const tonesText = tones.map((t) => toneLabels[t] || t).join(", ");
    const sportText = sportLabels[sport] || sport;
    const formatText = formatLabels[format] || format;

    const needsArt = format === "carrossel" || format === "estatico";

    const artInstruction = needsArt
      ? `\nComo o formato é ${formatText}, INCLUA OBRIGATORIAMENTE para cada roteiro:
- "artTemplate": Uma descrição detalhada de um template de arte visual que o atleta pode usar como referência. Descreva cores, composição, elementos visuais, tipografia, disposição dos elementos, estilo da foto/imagem e mood geral. Seja específico e criativo.
- "caption": Uma legenda pronta para usar na postagem, com emojis, hashtags relevantes e CTA.`
      : `\nNão inclua os campos "artTemplate" e "caption" no JSON.`;

    const systemPrompt = `Você é um especialista em marketing esportivo e criação de conteúdo para atletas nas redes sociais. Sua tarefa é criar roteiros criativos, envolventes e adaptados ao tom de comunicação solicitado, focados em ajudar atletas a fortalecer sua marca pessoal.

Sempre responda em português brasileiro. Crie roteiros práticos que sirvam como base para o atleta personalizar.

IMPORTANTE: Retorne EXATAMENTE um JSON válido com a seguinte estrutura, sem texto adicional, sem markdown, sem backticks. Apenas o JSON puro:
{
  "scripts": [
    {
      "title": "Título do roteiro",
      "content": ["Linha 1 do roteiro", "Linha 2 do roteiro", "..."],
      "note": "Observação sobre como usar este roteiro"${
        needsArt
          ? `,
      "artTemplate": "Descrição detalhada do template de arte",
      "caption": "Legenda pronta com emojis e hashtags"`
          : ""
      }
    }
  ]
}`;

    const userPrompt = `Crie 3 roteiros de postagem para um atleta de ${sportText}, no formato **${formatText}**:

**Descrição da postagem:** ${description}
**Tom de comunicação:** ${tonesText}
**Formato:** ${formatText}
${artInstruction}

Cada roteiro deve ter:
- Um título descritivo
- Conteúdo estruturado em etapas/falas adequadas ao formato ${formatText}
- Uma nota sobre como personalizar

Os roteiros devem ser criativos, usar linguagem natural e incluir ganchos de atenção, CTAs e elementos que aumentem o engajamento. Foque no universo esportivo: treinos, competições, bastidores, superação, rotina, patrocínios, motivação e conexão com fãs.`;

    console.log("Generating scripts for:", { sport, format, description, tones });

    // Call Google's Gemini API
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Limite de requisições excedido. Tente novamente em alguns instantes.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: "Chave da API inválida ou sem permissão." }),
          {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();

    // Gemini returns text inside candidates[0].content.parts[0].text
    const content: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error("Unexpected Gemini response shape:", JSON.stringify(data));
      throw new Error("No content in Gemini response");
    }

    console.log("AI response:", content);

    let scripts;
    try {
      // responseMimeType is "application/json" so this should already be clean JSON,
      // but stay defensive in case the model occasionally wraps it.
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        scripts = parsed.scripts;
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse AI response");
    }

    if (!Array.isArray(scripts)) {
      throw new Error("AI response did not contain a scripts array");
    }

    const formattedScripts = scripts.map(
      (
        script: {
          title: string;
          content: string[];
          note?: string;
          artTemplate?: string;
          caption?: string;
        },
        index: number,
      ) => ({
        id: `script-${Date.now()}-${index}`,
        title: script.title,
        content: script.content,
        note: script.note || `Tom sugerido: ${tonesText}`,
        ...(script.artTemplate && { artTemplate: script.artTemplate }),
        ...(script.caption && { caption: script.caption }),
      }),
    );

    return new Response(JSON.stringify({ scripts: formattedScripts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating scripts:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});