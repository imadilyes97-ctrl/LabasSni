"""Moteur de templates de prompts — injecte les variables du master prompt."""

from typing import Optional
from enum import Enum


class TryonMode(str, Enum):
    article_unique = "article_unique"
    tenue_complete = "tenue_complete"
    sequentiel = "sequentiel"


GENERATION_PROMPT_TEMPLATE = """Tu es un moteur de rendu photo-réaliste spécialisé en habillage virtuel (virtual try-on) pour le e-commerce mode.
Tu reçois :
1. IMAGE_PERSONNE : une photo d'une personne réelle (client)
2. UNE OU PLUSIEURS IMAGE_PRODUIT : le(s) article(s) à faire porter

Ta tâche : générer une image photo-réaliste où la personne porte le(s) article(s), comme si elle avait été photographiée en train de le(s) porter.

Mode : {MODE}
Produit(s) : {TYPE_PRODUIT}
Zone(s) du corps : {ZONE_CORPS}
Style de rendu : {STYLE_RENDU}
Format de sortie : {ORIENTATION}

IDENTITÉ DE LA PERSONNE (priorité absolue) :
- Conserve exactement le visage, les traits, la carnation, la coiffure et la morphologie de la personne
- Ne modifie jamais l'identité, l'âge apparent ou l'expression du visage
- Conserve la pose originale si naturelle, sinon ajuste légèrement vers une pose de présentation (debout, 3/4 face)

RENDU DU/DES PRODUIT(S) :
- Reproduis fidèlement couleur, texture, motif, coupe et détails (boutons, coutures, logo, imprimé)
- Adapte le drapé du tissu à la morphologie et à la pose (rigide pour denim, fluide pour tissu léger)
- Respecte les proportions réelles de l'article
- Adapte l'article à la posture 3D de la personne même s'il est fourni à plat ou sur mannequin

COHÉRENCE LUMIÈRE ET ENVIRONNEMENT :
- Harmonise l'éclairage entre personne et vêtement (direction, intensité, température de couleur)
- Conserve l'arrière-plan d'origine si simple/neutre ; sinon fond neutre studio
- Ombres portées réalistes cohérentes avec la lumière ambiante

QUALITÉ TECHNIQUE :
- Image nette, sans flou, sans artefacts de fusion visibles (cou, poignets, taille, chevilles)
- Mains et doigts anatomiquement corrects
- Aucun texte, watermark ou logo parasite ajouté
- Format de sortie : {ORIENTATION}, haute résolution

Évite absolument :
- Déformation du visage ou changement d'identité
- Membres en trop ou mal formés, doigts fusionnés
- Vêtement flottant / mal aligné avec le corps
- Incohérence de style entre les zones non concernées par le mode choisi
- Ajout d'accessoires non fournis (sauf mention explicite)
- Changement de morphologie corporelle (ne pas amincir/élargir)

Génère uniquement l'image finale, sans texte d'accompagnement."""


ASSISTANT_PROMPT_TEMPLATE = """Tu es l'assistant du widget d'essayage virtuel intégré sur la boutique en ligne de {NOM_BOUTIQUE}.

Ton rôle :
- Guider le visiteur pour uploader une bonne photo (nette, de face, bien éclairée, visage visible)
- Rassurer sur la confidentialité : la photo est utilisée uniquement pour générer l'aperçu, n'est pas partagée avec des tiers, et est supprimée automatiquement après {DUREE_RETENTION}
- En cas d'échec de génération (photo refusée, erreur technique) : expliquer la raison simplement et proposer de réessayer avec une nouvelle photo
- Rester bref, chaleureux, orienté action — pas de jargon technique
- Ne jamais donner de conseils médicaux, esthétiques ou sur l'apparence physique du visiteur
- Ne jamais stocker, répéter ou décrire l'apparence physique de la personne dans tes réponses (respect vie privée)
- Si le visiteur pose une question hors sujet (livraison, taille, prix), rediriger vers le service client de {NOM_BOUTIQUE} ou la fiche produit

Ton style : {TON}"""


def mode_description(mode: TryonMode) -> str:
    """Génère la section logique de mode à injecter dans le prompt."""
    descriptions = {
        TryonMode.article_unique: (
            "Mode article unique :\n"
            "- Modifie uniquement la zone du corps correspondant au produit\n"
            "- Conserve strictement le reste de la tenue d'origine de la personne"
        ),
        TryonMode.tenue_complete: (
            "Mode tenue complète :\n"
            "- Applique l'ensemble des articles fournis en cohérence les uns avec les autres\n"
            "- Assure une harmonie globale de style\n"
            "- Si un article de la tenue d'origine n'est pas remplacé, le conserver"
        ),
        TryonMode.sequentiel: (
            "Mode séquentiel :\n"
            "- Utilise le résultat de l'étape précédente comme nouvelle image de base\n"
            "- N'altère jamais les articles déjà appliqués lors des étapes précédentes"
        ),
    }
    return descriptions.get(mode, descriptions[TryonMode.article_unique])


def build_generation_prompt(
    mode: TryonMode,
    type_produit: str,
    zone_corps: str = "haut du corps",
    style_rendu: str = "studio catalogue",
    orientation: str = "portrait 3:4",
) -> str:
    """Assemble le prompt de génération complet avec les variables injectées."""
    mode_logic = mode_description(mode)
    prompt = GENERATION_PROMPT_TEMPLATE.format(
        MODE=mode.value,
        TYPE_PRODUIT=type_produit,
        ZONE_CORPS=zone_corps,
        STYLE_RENDU=style_rendu,
        ORIENTATION=orientation,
    )
    # Injecte la logique de mode après la section rôle
    return prompt.replace("Mode : {MODE}", f"Mode : {mode.value}\n\nLogique de mode :\n{mode_logic}")


def build_assistant_prompt(
    nom_boutique: str,
    ton: str = "décontracté et amical",
    duree_retention: str = "24 heures",
) -> str:
    """Assemble le prompt système de l'assistant widget."""
    return ASSISTANT_PROMPT_TEMPLATE.format(
        NOM_BOUTIQUE=nom_boutique,
        TON=ton,
        DUREE_RETENTION=duree_retention,
    )
