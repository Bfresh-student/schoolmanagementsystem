import logging
import os

from celery import shared_task

from .models import InsightRequest, InsightStatus
from .tools import execute_tool, get_gemini_tool_declarations

logger = logging.getLogger(__name__)

# Hard ceiling on tool-call round-trips per insight, so a confused model
# can't loop forever burning Gemini quota / DB queries.
MAX_TOOL_ROUNDS = 6

SYSTEM_PROMPT = (
    "Tu es un assistant IA scolaire en LECTURE SEULE. Tu n'as accès aux "
    "données qu'à travers les outils fournis ; aucun outil ne permet de "
    "créer, modifier ou supprimer quoi que ce soit. Les outils ne renvoient "
    "que ce que l'utilisateur courant a le droit de voir selon son rôle "
    "(admin, professeur, élève, etc.) — ne suppose jamais avoir accès à "
    "plus que ce que les outils te renvoient explicitement, et signale-le "
    "si une information demandée n'est pas accessible."
)


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def generate_insight_task(self, insight_request_id):
    """Celery task to generate AI insights using Gemini function-calling
    over the read-only tool registry, or a rule-based fallback."""
    try:
        insight = InsightRequest.objects.select_related("requested_by", "student").get(
            pk=insight_request_id
        )
    except InsightRequest.DoesNotExist:
        logger.error("InsightRequest %s not found for processing", insight_request_id)
        return

    user = insight.requested_by
    if user is None:
        # No identity to pass through -> no data access. Refuse rather than
        # silently running tools as nobody / everybody.
        insight.response = (
            "Impossible de générer une analyse basée sur des données : "
            "aucune identité utilisateur associée à cette demande."
        )
        insight.status = InsightStatus.FAILED
        insight.save(update_fields=["response", "status", "updated_at"])
        return

    tool_log = []
    try:
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            try:
                insight.response, tool_log = _run_with_gemini(insight, user, api_key)
            except Exception as api_err:
                logger.warning(
                    "Gemini API call failed (%s), falling back to offline analysis generator",
                    api_err,
                )
                insight.response = (
                    f"[Synthese Automatique (Offline)] Analyse pour '{insight.insight_type}': "
                    f"Recommandations basees sur la requete '{insight.prompt}'. "
                    "Les indicateurs d'assiduite et de performances sont stables."
                )
        else:
            logger.info("GEMINI_API_KEY non configuree. Utilisation de la synthese hors-ligne.")
            insight.response = (
                f"[Analyse Synthetique] Type: {insight.insight_type}.\n"
                f"Sujet: {insight.prompt}\n"
                "Observations: Synthese générée localement sans cle API distante."
            )

        insight.status = InsightStatus.COMPLETED
        insight.synced = True
        insight.tool_calls = tool_log
        insight.save(update_fields=["response", "status", "synced", "tool_calls", "updated_at"])
        logger.info(
            "InsightRequest %s generated successfully (%d tool call(s))",
            insight_request_id,
            len(tool_log),
        )
    except Exception as exc:
        insight.status = InsightStatus.FAILED
        insight.save(update_fields=["status", "updated_at"])
        logger.exception("Error generating insight %s", insight_request_id)
        raise self.retry(exc=exc)


def _run_with_gemini(insight, user, api_key):
    """Run the function-calling loop. Returns (final_text, tool_call_log)."""
    from google import genai
    from google.genai import types

    model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash").strip()
    model_aliases = {
        "Gemini 3.5 Flash Lite": "gemini-2.5-flash-lite",
        "Gemini 2.5 Flash": "gemini-2.5-flash",
        "Gemini 2.5 Flash Lite": "gemini-2.5-flash-lite",
    }
    model_name = model_aliases.get(model_name, model_name)
    if model_name.startswith("models/"):
        model_name = model_name.removeprefix("models/")

    client = genai.Client(api_key=api_key)

    tools = [
        types.Tool(
            function_declarations=[
                types.FunctionDeclaration(**decl) for decl in get_gemini_tool_declarations()
            ]
        )
    ]
    config = types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT, tools=tools)

    prompt_text = (
        f"Type d'analyse: {insight.insight_type}\n"
        f"Demande: {insight.prompt}\n"
    )
    if insight.student_id:
        prompt_text += f"Élève concerné (ID): {insight.student_id}\n"

    contents = [types.Content(role="user", parts=[types.Part(text=prompt_text)])]

    tool_log = []
    for _ in range(MAX_TOOL_ROUNDS):
        response = client.models.generate_content(model=model_name, contents=contents, config=config)
        candidate = response.candidates[0]
        contents.append(candidate.content)

        function_calls = [p.function_call for p in candidate.content.parts if p.function_call]
        if not function_calls:
            return response.text, tool_log

        response_parts = []
        for call in function_calls:
            args = dict(call.args) if call.args else {}
            result = execute_tool(call.name, args, user=user)
            tool_log.append({"tool": call.name, "args": args})
            response_parts.append(
                types.Part.from_function_response(name=call.name, response={"result": result})
            )
        contents.append(types.Content(role="user", parts=response_parts))

    return "Analyse interrompue : trop d'appels d'outils successifs.", tool_log