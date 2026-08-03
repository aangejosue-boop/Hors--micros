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

// Longueur en dessous de laquelle un terme est considéré "court" et donc
// dangereux en comparaison "sous-chaîne libre" (risque de faux positif par
// collision entre deux mots voisins, ex: "dura[nt m]on" -> "ntm").
// Ces termes courts sont comparés comme des MOTS ENTIERS uniquement.
const SHORT_TERM_THRESHOLD = 4;

// Normalise le texte en OTANT les accents / leetspeak, mais en remplaçant
// la ponctuation et les espaces par un unique espace (au lieu de les
// supprimer). Ça garde les frontières de mots intactes pour la détection
// "mot entier", tout en neutralisant les emojis/ponctuation parasites.
function normalizeKeepWordBoundaries(text: string): string {
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
    .replace(/[^a-z]+/g, " ") // tout non-lettre devient un espace (au lieu d'être supprimé)
    .trim()
    .replace(/(.)\1{2,}/g, "$1$1"); // "coooonnard" -> "coonnard"
}

// Version "collée" (sans aucun espace) réservée aux termes longs, pour
// continuer à attraper les contournements du type "c o n n a r d" ou
// "c.o.n.n.a.r.d" — acceptable pour les termes longs car le risque de
// collision accidentelle entre deux mots voisins diminue avec la longueur.
function normalizeCollapsed(text: string): string {
  return normalizeKeepWordBoundaries(text).replace(/ /g, "");
}

export function findBannedTerm(text: string): string | null {
  const withBoundaries = normalizeKeepWordBoundaries(text);
  const words = withBoundaries.split(" ").filter(Boolean);
  const wordSet = new Set(words);
  const collapsed = withBoundaries.replace(/ /g, "");

  for (const term of BANNED_TERMS) {
    const normalizedTerm = normalizeCollapsed(term);

    if (normalizedTerm.length <= SHORT_TERM_THRESHOLD && !term.includes(" ")) {
      // Terme court et composé d'un seul mot ("ntm", "fdp", "con"...) :
      // on exige une correspondance de MOT ENTIER pour éviter les faux
      // positifs de jonction ("durant mon" ne doit pas matcher "ntm").
      if (wordSet.has(normalizedTerm)) {
        return term;
      }
    } else {
      // Terme long ou expression à plusieurs mots : comparaison en
      // sous-chaîne sur la version collée, pour garder la protection
      // anti-contournement ("c o n n a r d", "c.o.n.n.a.r.d"...).
      if (collapsed.includes(normalizedTerm)) {
        return term;
      }
    }
  }
  return null;
}

export function isContentAllowed(text: string): boolean {
  return findBannedTerm(text) === null;
}

export const MODERATION_WARNING =
  "Ton message contient des propos non autorisés (insultes, haine ou contenu sexuel inapproprié) et n'a pas été publié. Merci de reformuler.";