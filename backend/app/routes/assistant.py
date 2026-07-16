"""Routes pour l'assistant conversationnel du widget client."""

import logging
from fastapi import APIRouter, Depends

from ..models.tryon import AssistantRequest, AssistantResponse
from ..models.tenant import get_tenant
from ..services.prompt_engine import build_assistant_prompt
from ..core.security import verify_tenant

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/assistant", tags=["assistant"])


@router.post("/chat", response_model=AssistantResponse)
async def assistant_chat(
    request: AssistantRequest,
    tenant_id: str = Depends(verify_tenant),
):
    """Répond au visiteur via l'assistant widget.

    Pour l'instant, utilise des templates de réponses.
    Phase 2 : intégration avec un LLM (via API) pour des réponses dynamiques.
    """
    tenant = get_tenant(request.tenant_id if request.tenant_id != "default" else tenant_id)
    system_prompt = build_assistant_prompt(
        nom_boutique=tenant.nom_boutique,
        ton=tenant.ton,
        duree_retention=tenant.duree_retention,
    )

    msg_lower = request.message.lower()
    reply = _get_template_reply(msg_lower, request.upload_state)

    return AssistantResponse(
        reply=reply,
        suggested_actions=_get_suggested_actions(reply),
    )


def _get_template_reply(message: str, upload_state: str | None = None) -> str:
    """Réponses template pour l'assistant."""
    if "confidentialité" in message or "privé" in message or "donnée" in message:
        return (
            "🔒 Pas d'inquiétude ! Ta photo est utilisée uniquement pour "
            "générer l'aperçu d'essayage. Elle n'est partagée avec personne "
            "et supprimée automatiquement après 24h. "
            "Tu peux essayer en toute tranquillité !"
        )

    if "comment" in message or "aide" in message or "pas" in message:
        return (
            "📸 C'est très simple :\n"
            "1. Prends une photo de toi (de face, bien éclairée)\n"
            "2. Choisis le produit qui te plaît\n"
            "3. On s'occupe du reste — tu verras le rendu en quelques secondes !\n\n"
            "Prêt(e) à essayer ?"
        )

    if "erreur" in message or "échec" in message or "marche pas" in message:
        return (
            "😅 Oups, quelque chose s'est mal passé. "
            "Cela arrive parfois si la photo n'est pas assez nette ou bien éclairée. "
            "Essaie avec :\n"
            "✅ Une photo de face\n"
            "✅ Un bon éclairage\n"
            "✅ Un visage bien visible\n\n"
            "Tu veux réessayer ?"
        )

    if "livraison" in message or "prix" in message or "taille" in message:
        return (
            "📞 Pour les questions de livraison, taille ou prix, "
            "je te invite à contacter le service client ou à consulter "
            "la fiche produit — ils pourront te renseigner précisément !"
        )

    # Message par défaut
    return (
        "👋 Bienvenue sur l'essayage virtuel ! "
        "Uploade ta photo et choisis un produit pour voir le rendu "
        "en temps réel. Besoin d'aide ? Dis-moi !"
    )


def _get_suggested_actions(reply: str) -> list[str]:
    """Suggestions d'actions selon le contexte."""
    if "confidentialité" in reply:
        return ["Commencer l'essayage", "Voir les produits"]
    if "réessayer" in reply:
        return ["Prendre une nouvelle photo", "Choisir un autre produit"]
    if "service client" in reply:
        return ["Voir la fiche produit", "Contacter le service client"]
    return ["Uploader ma photo", "Voir les produits", "Comment ça marche ?"]
