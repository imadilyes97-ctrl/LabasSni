"""Routes pour l'assistant conversationnel du widget client (Master Prompt B)."""

import logging
from fastapi import APIRouter, Depends
from ..models.tryon import AssistantRequest, AssistantResponse
from ..models.tenant import get_tenant
from ..core.security import verify_tenant

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/assistant", tags=["assistant"])


@router.post("/chat", response_model=AssistantResponse)
async def assistant_chat(request: AssistantRequest, tenant_id: str = Depends(verify_tenant)):
    tenant = get_tenant(request.tenant_id if request.tenant_id != "default" else tenant_id)
    msg = request.message.lower()
    reply = _get_reply(msg, request.upload_state)
    return AssistantResponse(reply=reply, suggested_actions=_get_actions(reply))


def _get_reply(message: str, upload_state: str | None = None) -> str:
    if not upload_state or upload_state == "initial":
        return ("👋 Bienvenue sur l'essayage virtuel ! Prends une photo de toi (de face, bien éclairée). "
                "🔒 Ta photo est utilisée uniquement pour la génération et supprimée après 24h.")
    if upload_state == "uploading":
        return "📸 Parfait ! J'analyse ta photo... Prêt à voir le rendu ?"
    if upload_state == "generating":
        return "✨ Génération en cours ! Ça peut prendre jusqu'à 30 secondes la première fois."
    if "confidentialité" in message or "privé" in message:
        return "🔒 Ta photo est utilisée uniquement pour générer l'aperçu. Supprimée automatiquement après 24h. Jamais partagée."
    if "erreur" in message or "échec" in message or "marche pas" in message:
        return ("😅 Désolé, un problème est survenu. Essaie avec une photo bien éclairée, de face, "
                "visage visible. Tu veux réessayer ?")
    if "résultat" in message or "vois" in message or "rendu" in message:
        return ("✨ Voici un aperçu généré par IA — le rendu réel peut légèrement varier. "
                "Tu peux ajouter au panier, voir d'autres tailles/couleurs, ou réessayer avec une autre photo.")
    if "livraison" in message or "prix" in message or "taille" in message:
        return "📞 Pour les questions de livraison, taille ou prix, le service client pourra te renseigner !"
    return ("📸 C'est simple : upload ta photo, choisis le produit, et on génère le rendu en quelques secondes. "
            "Besoin d'aide ? Dis-moi !")


def _get_actions(reply: str) -> list[str]:
    if "confidentialité" in reply or "supprimée" in reply:
        return ["Uploader ma photo", "Voir les produits"]
    if "réessayer" in reply:
        return ["Prendre une nouvelle photo", "Choisir un autre produit"]
    if "aperçu" in reply:
        return ["Ajouter au panier", "Réessayer", "Voir d'autres tailles"]
    return ["Uploader ma photo", "Comment ça marche ?", "Confidentialité ?"]
