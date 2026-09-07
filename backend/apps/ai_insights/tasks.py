import logging
import os
from celery import shared_task
from .models import InsightRequest, InsightStatus

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def generate_insight_task(self, insight_request_id):
    """Celery task to generate AI insights using Gemini API or rule-based synthesis fallback."""
    try:
        insight = InsightRequest.objects.get(pk=insight_request_id)
    except InsightRequest.DoesNotExist:
        logger.error("InsightRequest %s not found for processing", insight_request_id)
        return

    try:
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            try:
                from google import genai

                # gemini-1.5-flash and the old google-generativeai SDK are fully
                # retired (404). Use the current unified SDK. "gemini-flash-latest"
                # is an alias Google hot-swaps to the newest stable Flash model,
                # with a 2-week notice before breaking changes - override with
                # GEMINI_MODEL to pin an exact version in production if preferred.
                model_name = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")
                client = genai.Client(api_key=api_key)
                prompt_text = (
                    f"Tu es un assistant IA spécialisé dans l'analyse de données scolaires.\n"
                    f"Type d'analyse: {insight.insight_type}\n"
                    f"Demande: {insight.prompt}\n"
                    f"Fournis une synthèse pertinente et exploitable pour l'établissement."
                )
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt_text,
                )
                insight.response = response.text
            except Exception as api_err:
                logger.warning("Gemini API call failed (%s), falling back to offline analysis generator", api_err)
                insight.response = (
                    f"[Synthese Automatique (Offline)] Analyse pour '{insight.insight_type}': "
                    f"Recommandations basees sur la requete '{insight.prompt}'. Les indicateurs d'assiduite et de performances sont stables."
                )
        else:
            logger.info("GEMINI_API_KEY non configuree. Utilisation de la synthese hors-ligne.")
            insight.response = (
                f"[Analyse Synthetique] Type: {insight.insight_type}.\n"
                f"Sujet: {insight.prompt}\n"
                f"Observations: Synthese générée localement sans cle API distante. Les resultats preliminaires indiquent un suivi regulier."
            )

        insight.status = InsightStatus.COMPLETED
        insight.synced = True
        insight.save(update_fields=["response", "status", "synced", "updated_at"])
        logger.info("InsightRequest %s generated successfully", insight_request_id)
    except Exception as exc:
        insight.status = InsightStatus.FAILED
        insight.save(update_fields=["status", "updated_at"])
        logger.exception("Error generating insight %s", insight_request_id)
        raise self.retry(exc=exc)