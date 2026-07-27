// Filtre basique par liste de mots-clés : bloque les insultes, propos haineux
// et contenu sexuel explicite les plus courants avant publication.
// Limite assumée : ne comprend pas le sens d'une phrase, seulement des mots/expressions.

const BANNED_TERMS = [
  // Insultes courantes
  "connard", "connasse", "connarde", "con de", "enculé", "enculée",
  "enfoiré", "enfoirée", "salope", "salopard", "pute", "putain de", "fils de pute",
  "batard", "bâtard", "abruti", "abrutie", "débile mental", "attardé", "attardée",
  "sous-merde", "merdeux", "merdeuse", "ordure", "raclure", "fdp", "ntm",
  "nique ta mère", "nique sa mère", "va crever", "va te faire", "ferme ta gueule",
  "ta gueule", "gros porc", "sac à merde",

  // Haine / discrimination (insultes racistes, homophobes, religieuses, sexistes)
  "sale race", "sale arabe", "sale noir", "sale juif", "sale musulman",
  "bougnoule", "négro", "nègre", "chinetoque", "youpin", "feuj",
  "pédé", "sale pd", "tapette", "gouine",
  "sale gitan", "sale rom",
  "sous-race", "race inférieure", "vous êtes tous des", "retournez dans votre pays",

  // Menaces / incitation à la violence ou à la haine
  "je vais te tuer", "je vais te violer", "tu mérites de mourir", "tu devrais mourir",
  "vous devriez tous mourir", "il faut les exterminer", "il faut tous les tuer",
  "je vais te défoncer", "je vais te retrouver",

  // Contenu sexuel explicite / sollicitation
  "sexe explicite", "envoie des nudes", "envoie moi des nudes", "envoie une nude",
  "photo de sexe", "photo de toi nue", "photo de toi nu", "plan cul", "sexto",
  "montre moi tes seins", "montre moi ton sexe",
  "viol", "violer quelqu'un", "je veux te violer",

  // Contenu impliquant des mineurs (priorité absolue : tolérance zéro)
  "pédophile", "pédophilie", "pédopornographie", "pedoporn", "lolicon",
  "relation sexuelle avec un mineur", "relation sexuelle avec une mineure",
  "relations sexuelles avec des enfants", "sexe avec un enfant", "sexe avec une enfant",
  "sexe avec un mineur", "sexe avec une mineure", "nue mineure", "nu mineur",
  "envoie des nudes mineure", "photo nue mineure", "attirance pour les enfants",
];

// Retire tout caractère qui n'est pas une lettre (espaces, ponctuation, emojis...).
// Sans ça, "c o n n a r d" ou "c.o.n.n.a.r.d" passait au travers du filtre car la
// comparaison se fait par sous-chaîne : il faut que les lettres se retrouvent
// bord à bord des deux côtés de la comparaison pour matcher, contournement sinon.
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
    .replace(/7/g, "t")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/[^a-z]/g, "")
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
