// ai_insights_client.js
//
// Bridges the client-side "CEJEC IA" chat widget (js/AI_Script.js, pure
// keyword matching, works offline) to the real backend endpoint at
// apps/ai_insights, which calls Gemini server-side.
//
// Loaded as a plain <script> (not type="module") so every page that already
// includes AI_Script.js can use it without extra wiring. It reaches the ES
// module auth.js/authFetch helper via a dynamic import().
//
// Generation runs through Celery (see backend/apps/ai_insights/tasks.py), so
// the POST can come back "pending" — this polls the detail endpoint until
// the status flips to "completed" or "failed".

window.askAIInsight = async function askAIInsight(
  prompt,
  insightType = "chat_assistant",
  { timeoutMs = 20000, pollIntervalMs = 1200 } = {}
) {
  // Resolved relative to the page, since this file runs as a classic script
  // (auth.js lives at frontend/auth.js, same folder as the HTML pages).
  const { authFetch } = await import("../auth.js");

  const created = await authFetch("ai-insights/requests/", {
    method: "POST",
    body: { prompt, insight_type: insightType },
  });

  if (created.status === "completed") return created.response;
  if (created.status === "failed") {
    throw new Error("La génération de la réponse a échoué.");
  }

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    const updated = await authFetch(`ai-insights/requests/${created.id}/`);
    if (updated.status === "completed") return updated.response;
    if (updated.status === "failed") {
      throw new Error("La génération de la réponse a échoué.");
    }
  }

  throw new Error("Délai dépassé en attendant la réponse de l'IA.");
};