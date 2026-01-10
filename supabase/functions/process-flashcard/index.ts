import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { front, back, category } = await req.json();

    const apiKey = Deno.env.get("GOOGLE_GENAI_API_KEY");
    if (!apiKey) {
      throw new Error("Missing GOOGLE_GENAI_API_KEY");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Tu es un expert en pédagogie et en création de flashcards (méthode Anki).
Ton but est de transformer un couple "Question/Réponse" brut en une flashcard pédagogique, concise et efficace.

RÈGLES :
1. La question (Front) doit être claire et inciter à une réponse précise (Active Recall).
2. La réponse (Back) doit être concise, structurée (utiliser des puces si nécessaire) et facile à mémoriser.
3. Garde le ton amical et pro d'Oreegami.
4. Réponds EXCLUSIVEMENT au format JSON comme ceci : {"front": "...", "back": "...", "category": "..."}.

DONNÉES BRUTES :
Question originale : ${front}
Réponse originale : ${back}
Catégorie : ${category}

TRANSFORMATION :`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON if AI wrapped it in markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const flashcard = jsonMatch ? JSON.parse(jsonMatch[0]) : { front, back, category };

    return new Response(JSON.stringify(flashcard), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
