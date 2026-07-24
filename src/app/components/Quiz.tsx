import { useState } from "react";
import { X, Brain, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
];

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

  const current = QUESTIONS[index];

  function choose(choiceIndex: number) {
    if (selected !== null) return;
    setSelected(choiceIndex);
    if (choiceIndex === current.correct) {
      setScore((s) => s + 1);
    }
  }

  function next() {
    if (index + 1 >= QUESTIONS.length) {
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
                      {index + 1}/{QUESTIONS.length}
                    </span>
                  </div>

                  <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mb-5">
                    <div
                      className="h-full bg-primary transition-all rounded-full"
                      style={{ width: `${((index + (selected !== null ? 1 : 0)) / QUESTIONS.length) * 100}%` }}
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
                    {index + 1 >= QUESTIONS.length ? "Voir le résultat" : "Question suivante"}
                  </button>
                </>
              ) : (
                <div className="text-center py-6">
                  <p
                    className="text-3xl mb-2"
                    style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic" }}
                  >
                    {score}/{QUESTIONS.length}
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    {score === QUESTIONS.length
                      ? "Score parfait, bravo !"
                      : score >= QUESTIONS.length / 2
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
