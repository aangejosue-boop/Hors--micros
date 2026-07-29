import { useState } from "react";
import { X, Brain, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { dayIndex, dailySubset, seededShuffle } from "../../lib/daily";

interface Question {
  category: "Santé" | "Sport" | "Culture";
  question: string;
  choices: string[];
  correct: number;
}

const QUESTIONS: Question[] = [
  {
    category: "Santé",
    question: "Combien d'heures de sommeil sont recommandées par nuit pour un adulte ?",
    choices: ["4-5h", "7-9h", "10-12h", "2-3h"],
    correct: 1,
  },
  {
    category: "Santé",
    question: "Quelle activité aide le plus à réduire le stress à court terme ?",
    choices: ["Respiration profonde", "Regarder son téléphone", "Sauter un repas", "Rester éveillé toute la nuit"],
    correct: 0,
  },
  {
    category: "Santé",
    question: "Boire suffisamment d'eau par jour aide surtout à :",
    choices: ["Éviter la fatigue et les maux de tête", "Faire dormir plus longtemps", "Améliorer la vue", "Réduire le besoin de manger"],
    correct: 0,
  },
  {
    category: "Sport",
    question: "Combien de minutes d'activité physique modérée sont recommandées par semaine ?",
    choices: ["30 min", "60 min", "150 min", "500 min"],
    correct: 2,
  },
  {
    category: "Sport",
    question: "Quel sport se joue avec un volant ?",
    choices: ["Tennis de table", "Badminton", "Squash", "Golf"],
    correct: 1,
  },
  {
    category: "Sport",
    question: "Dans quel sport utilise-t-on le terme 'ippon' ?",
    choices: ["Judo", "Escrime", "Karaté", "Boxe"],
    correct: 0,
  },
  {
    category: "Culture",
    question: "Qui a peint 'La Nuit étoilée' ?",
    choices: ["Claude Monet", "Vincent van Gogh", "Pablo Picasso", "Salvador Dalí"],
    correct: 1,
  },
  {
    category: "Culture",
    question: "Dans quelle ville se trouve le musée du Louvre ?",
    choices: ["Lyon", "Marseille", "Paris", "Bruxelles"],
    correct: 2,
  },
  {
    category: "Culture",
    question: "Quel auteur a écrit 'Le Petit Prince' ?",
    choices: ["Victor Hugo", "Antoine de Saint-Exupéry", "Albert Camus", "Molière"],
    correct: 1,
  },
  {
    category: "Santé",
    question: "Quel groupe d'aliments est la meilleure source de fibres ?",
    choices: ["Fruits et légumes", "Charcuterie", "Sodas", "Fritures"],
    correct: 0,
  },
  {
    category: "Sport",
    question: "Combien de joueurs compte une équipe de basketball sur le terrain ?",
    choices: ["4", "5", "6", "7"],
    correct: 1,
  },
  {
    category: "Culture",
    question: "Qui a écrit la pièce 'Roméo et Juliette' ?",
    choices: ["Molière", "Victor Hugo", "William Shakespeare", "Emile Zola"],
    correct: 2,
  },
  {
    category: "Santé",
    question: "Combien de fois par semaine est-il recommandé de faire du sport pour rester en forme ?",
    choices: ["Jamais", "1 fois", "Au moins 3 fois", "Tous les jours sans exception"],
    correct: 2,
  },
  {
    category: "Santé",
    question: "Quelle vitamine le corps produit-il principalement grâce au soleil ?",
    choices: ["Vitamine C", "Vitamine D", "Vitamine B12", "Vitamine K"],
    correct: 1,
  },
  {
    category: "Santé",
    question: "Quel est le muscle le plus volumineux du corps humain ?",
    choices: ["Le biceps", "Le grand fessier", "Le triceps", "Le mollet"],
    correct: 1,
  },
  {
    category: "Santé",
    question: "Combien de temps dure en moyenne un cycle de sommeil ?",
    choices: ["30 minutes", "90 minutes", "3 heures", "15 minutes"],
    correct: 1,
  },
  {
    category: "Santé",
    question: "Quel geste simple aide à calmer l'anxiété en quelques secondes ?",
    choices: ["Retenir sa respiration", "Expirer plus longtemps qu'on inspire", "Respirer très vite", "Serrer les poings fort"],
    correct: 1,
  },
  {
    category: "Santé",
    question: "Quel organe filtre le sang pour éliminer les déchets ?",
    choices: ["Le foie", "Les reins", "L'estomac", "La rate"],
    correct: 1,
  },
  {
    category: "Santé",
    question: "Quelle habitude simple améliore la circulation sanguine au quotidien ?",
    choices: ["Marcher régulièrement", "Rester assis toute la journée", "Sauter des repas", "Multiplier les écrans"],
    correct: 0,
  },
  {
    category: "Sport",
    question: "Combien de joueurs compose une équipe de football sur le terrain ?",
    choices: ["9", "10", "11", "12"],
    correct: 2,
  },
  {
    category: "Sport",
    question: "Dans quel sport utilise-t-on le terme 'ace' ?",
    choices: ["Tennis", "Football", "Natation", "Escrime"],
    correct: 0,
  },
  {
    category: "Sport",
    question: "Dans quel pays le judo a-t-il été inventé ?",
    choices: ["Chine", "Japon", "Corée du Sud", "Thaïlande"],
    correct: 1,
  },
  {
    category: "Sport",
    question: "Combien de temps dure un match de basketball NBA, hors prolongations ?",
    choices: ["40 minutes", "48 minutes", "60 minutes", "90 minutes"],
    correct: 1,
  },
  {
    category: "Sport",
    question: "Quel sport combine planche et voile ?",
    choices: ["Surf", "Planche à voile", "Skateboard", "Snowboard"],
    correct: 1,
  },
  {
    category: "Sport",
    question: "Combien de sets faut-il gagner pour remporter un match de tennis en 3 sets gagnants ?",
    choices: ["1", "2", "3", "4"],
    correct: 1,
  },
  {
    category: "Sport",
    question: "Quelle nage est considérée comme la plus rapide en natation ?",
    choices: ["La brasse", "Le dos crawlé", "La nage libre (crawl)", "Le papillon"],
    correct: 2,
  },
  {
    category: "Culture",
    question: "Qui a peint la Joconde ?",
    choices: ["Michel-Ange", "Léonard de Vinci", "Raphaël", "Botticelli"],
    correct: 1,
  },
  {
    category: "Culture",
    question: "Dans quel pays se trouve la tour de Pise ?",
    choices: ["Espagne", "Italie", "Grèce", "Portugal"],
    correct: 1,
  },
  {
    category: "Culture",
    question: "Qui a écrit 'Les Misérables' ?",
    choices: ["Victor Hugo", "Émile Zola", "Gustave Flaubert", "Alexandre Dumas"],
    correct: 0,
  },
  {
    category: "Culture",
    question: "Quelle est la capitale du Japon ?",
    choices: ["Séoul", "Pékin", "Tokyo", "Bangkok"],
    correct: 2,
  },
  {
    category: "Culture",
    question: "Qui a composé 'La Flûte enchantée' ?",
    choices: ["Beethoven", "Mozart", "Bach", "Chopin"],
    correct: 1,
  },
  {
    category: "Culture",
    question: "Dans quelle mythologie trouve-t-on le dieu Zeus ?",
    choices: ["Égyptienne", "Grecque", "Nordique", "Romaine"],
    correct: 1,
  },
  {
    category: "Culture",
    question: "Quel peintre est connu pour s'être coupé une partie de l'oreille ?",
    choices: ["Pablo Picasso", "Vincent van Gogh", "Claude Monet", "Edvard Munch"],
    correct: 1,
  },
];

const QUESTIONS_PER_DAY = 8;

const DAILY_QUESTIONS = seededShuffle(dailySubset(QUESTIONS, QUESTIONS_PER_DAY), dayIndex());

const CATEGORY_COLOR: Record<Question["category"], string> = {
  Santé: "text-accent-mint",
  Sport: "text-accent-gold",
  Culture: "text-accent-violet",
};

interface QuizProps {
  open: boolean;
  onClose: () => void;
}

export default function Quiz({ open, onClose }: QuizProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = DAILY_QUESTIONS[index];

  function choose(choiceIndex: number) {
    if (selected !== null) return;
    setSelected(choiceIndex);
    if (choiceIndex === current.correct) {
      setScore((s) => s + 1);
    }
  }

  function next() {
    if (index + 1 >= DAILY_QUESTIONS.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  }

  function restart() {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }

  function handleClose() {
    restart();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border shadow-2xl"
          >
            <div className="max-w-2xl mx-auto p-6">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />

              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2
                    className="text-lg font-medium flex items-center gap-2"
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    <Brain className="w-5 h-5" />
                    Petit quiz
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Santé, sport, culture — pour faire une pause
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!finished ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-medium uppercase tracking-widest ${CATEGORY_COLOR[current.category]}`}>
                      {current.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {index + 1}/{DAILY_QUESTIONS.length}
                    </span>
                  </div>

                  <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mb-5">
                    <div
                      className="h-full bg-primary transition-all rounded-full"
                      style={{ width: `${((index + (selected !== null ? 1 : 0)) / DAILY_QUESTIONS.length) * 100}%` }}
                    />
                  </div>

                  <p
                    className="text-base leading-relaxed mb-5"
                    style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
                  >
                    {current.question}
                  </p>

                  <div className="space-y-2 mb-5">
                    {current.choices.map((choice, i) => {
                      const isCorrect = i === current.correct;
                      const isSelected = i === selected;
                      let stateClasses = "bg-secondary text-foreground hover:opacity-80";
                      if (selected !== null) {
                        if (isCorrect) {
                          stateClasses = "bg-accent-mint/20 border border-accent-mint text-foreground";
                        } else if (isSelected) {
                          stateClasses = "bg-accent-rose/20 border border-accent-rose text-foreground";
                        } else {
                          stateClasses = "bg-secondary text-muted-foreground";
                        }
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => choose(i)}
                          disabled={selected !== null}
                          className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm text-left transition-all ${stateClasses}`}
                        >
                          <span>{choice}</span>
                          {selected !== null && isCorrect && <CheckCircle2 className="w-4 h-4 text-accent-mint flex-shrink-0" />}
                          {selected !== null && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-accent-rose flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={next}
                    disabled={selected === null}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-medium text-sm transition-opacity disabled:opacity-40 hover:opacity-90"
                  >
                    {index + 1 >= DAILY_QUESTIONS.length ? "Voir le résultat" : "Question suivante"}
                  </button>
                </>
              ) : (
                <div className="text-center py-6">
                  <p
                    className="text-3xl mb-2"
                    style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic" }}
                  >
                    {score}/{DAILY_QUESTIONS.length}
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    {score === DAILY_QUESTIONS.length
                      ? "Score parfait, bravo !"
                      : score >= DAILY_QUESTIONS.length / 2
                      ? "Bien joué !"
                      : "Pas mal, retente ta chance !"}
                  </p>
                  <button
                    onClick={restart}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-medium text-sm transition-opacity hover:opacity-90"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Rejouer
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
