// Filtre basique par liste de mots-clés : bloque les insultes, propos haineux
// et contenu sexuel explicite les plus courants avant publication.
// Limite assumée : ne comprend pas le sens d'une phrase, seulement des mots/expressions.

const BANNED_TERMS = [
  // Insultes courantes
  "connard", "connasse", "connards", "connasses", "con de", "enculé", "enculée",
  "enfoiré", "enfoirée", "salope", "salopard", "pute", "putain de", "batard",
  "bâtard", "abruti", "abrutie", "débile mental", "attardé", "attardée",
  "sous-merde", "ordure", "raclure", "fdp", "ntm", "nique ta mère", "nique sa mère",
  "va crever", "va te faire", "ferme ta gueule", "ta gueule", "gros porc",

  // Haine / discrimination (insultes racistes, homophobes, religieuses, sexistes)
  "sale race", "sale arabe", "sale noir", "sale juif", "sale musulman",
  "bougnoule", "négro", "nègre", "chinetoque", "youpin", "feuj",
  "pédé", "sale pd", "tapette", "gouine",
  "sale gitan", "sale rom",
  "sous-race", "race inférieure", "vous êtes tous des", "retournez dans votre pays",

  // Menaces / incitation à la violence ou à la haine
  "je vais te tuer", "je vais te violer", "tu mérites de mourir", "tu devrais mourir",
  "vous devriez tous mourir", "il faut les exterminer", "il faut tous les tuer",

  // Contenu sexuel explicite
  "sexe explicite", "envoie des nudes", "envoie moi des nudes", "photo de sexe",
  "viol", "violer quelqu'un", "pédophile", "pédopornographie", "pedoporn",
  "je veux te violer", "relation sexuelle avec un mineur", "sexe avec un enfant",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // retire les accents
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/[^a-z\s]/g, " ")
    .replace(/(.)\1{2,}/g, "$1$1"); // "coooonnard" -> "coonnard"
}

export function findBannedTerm(text: string): string | null {
  const normalized = normalize(text);
  for (const term of BANNED_TERMS) {
    if (normalized.includes(normalize(term))) {
      return term;
    }
  }
  return null;
}

export function isContentAllowed(text: string): boolean {
  return findBannedTerm(text) === null;
}

export const MODERATION_WARNING =
  "Ton message contient des propos non autorisés (insultes, haine ou contenu sexuel inapproprié) et n'a pas été publié. Merci de reformuler.";
