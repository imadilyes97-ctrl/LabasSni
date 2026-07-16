import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité — lebeSsni",
  description:
    "Politique de confidentialité de lebeSsni — comment vos données sont collectées, utilisées et protégées lors de l'essayage virtuel IA.",
};

const sections = [
  {
    title: "1. Données collectées",
    content:
      "Lorsque vous utilisez notre service d'essayage virtuel, nous collectons les données suivantes :",
    items: [
      "La photo que vous uploadez pour générer l'essayage virtuel",
      "Votre adresse IP (nécessaire au fonctionnement technique du service)",
      "Le type de produit sélectionné pour l'essayage",
      "Les informations de session nécessaires à la génération (timestamp, identifiant unique temporaire)",
    ],
  },
  {
    title: "2. Utilisation des données",
    content:
      "Vos données sont utilisées exclusivement pour :",
    items: [
      "Générer l'essayage virtuel du produit sélectionné sur votre photo via notre modèle d'intelligence artificielle",
      "Afficher le résultat de l'essayage sur la page de résultat",
      "Assurer le bon fonctionnement technique du service (traitement de la requête, distribution CDN)",
      "Améliorer notre modèle IA de manière agrégée et anonymisée — jamais à partir de vos photos individuelles",
    ],
  },
  {
    title: "3. Stockage et suppression",
    content:
      "Nous appliquons une rétention minimale des données :",
    items: [
      "Votre photo est stockée de manière sécurisée sur nos serveurs le temps du traitement",
      "Elle est automatiquement et définitivement supprimée sous 24 heures maximum",
      "Le résultat généré (image d'essayage) suit la même politique de suppression",
      "Aucune copie de sauvegarde n'est conservée au-delà de ce délai",
      "Les logs techniques (adresse IP, timestamp) sont conservés 30 jours à des fins de sécurité et de diagnostic, puis anonymisés",
    ],
  },
  {
    title: "4. Partage des données",
    content:
      "Nous ne partageons jamais vos données avec des tiers. En particulier :",
    items: [
      "Aucune revente de données à des annonceurs ou courtiers en données",
      "Aucun partage avec des réseaux sociaux ou plateformes tierces",
      "Aucune utilisation pour de l'entraînement externe de modèles IA",
      "Notre infrastructure d'hébergement (RunPod, Vercel) a accès aux données dans le strict cadre technique et ne peut pas les réutiliser",
      "Nous pouvons divulguer des informations si la loi nous y oblige (mandat judiciaire valide)",
    ],
  },
  {
    title: "5. Cookies et traceurs",
    content:
      "Notre plateforme n'utilise pas de cookies à des fins de suivi publicitaire par défaut.",
    items: [
      "Aucun cookie technique autre que ceux strictement nécessaires au fonctionnement de la session d'essayage",
      "Aucun cookie de mesure d'audience ou de traçage analytique",
      "Si le vendeur (boutique partenaire) a configuré des pixels Meta (Facebook) ou TikTok sur sa page produit, ces traceurs sont régis par leurs propres politiques de confidentialité et peuvent collecter des données selon les préférences de consentement du visiteur",
      "Nous n'avons aucun contrôle sur les traceurs configurés par les boutiques partenaires et vous invitons à consulter leur politique de confidentialité respective",
    ],
  },
  {
    title: "6. Vos droits",
    content:
      "Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :",
    items: [
      "Droit d'accès — savoir quelles données nous détenons sur vous",
      "Droit de rectification — demander la correction de données inexactes",
      "Droit à l'effacement — demander la suppression anticipée de vos données",
      "Droit à la limitation du traitement — restreindre l'utilisation de vos données",
      "Droit d'opposition — vous opposer au traitement de vos données",
      "Droit à la portabilité — récupérer vos données dans un format structuré",
    ],
  },
  {
    title: "7. Contact",
    content:
      "Pour toute question relative à cette politique de confidentialité ou pour exercer vos droits RGPD, vous pouvez nous contacter :",
    items: [
      "Email : privacy@lebessni.com",
      "Temps de réponse : sous 48 heures ouvrées maximum",
      "Pour les demandes de suppression anticipée, merci de préciser l'identifiant temporaire de votre session (si disponible)",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <span aria-hidden="true">&larr;</span> Retour
        </Link>

        {/* Header */}
        <div className="mt-8 mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
            Politique de confidentialité
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            Dernière mise à jour : juillet 2026
          </p>
          <p className="mt-6 text-zinc-400 leading-relaxed">
            Chez <span className="font-semibold text-zinc-200">lebeSsni</span>, la protection de vos
            données personnelles est une priorité. Cette politique explique comment nous collectons,
            utilisons et protégeons vos informations lorsque vous utilisez notre service d&apos;essayage
            virtuel IA.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold text-zinc-100 mb-3">
                {section.title}
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-3">
                {section.content}
              </p>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-zinc-500"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-16 border-t border-zinc-800 pt-8 text-center">
          <p className="text-xs text-zinc-600">
            lebeSsni &mdash; Essayage Virtuel IA &mdash; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
