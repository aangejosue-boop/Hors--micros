import { useEffect, useState } from "react";
import { Lightbulb, X } from "lucide-react";

const STORAGE_KEY = "hors-micro-onboarding-seen";

const TIPS = [
  "Écris librement, personne ne sait que c'est toi.",
  "Réagis aux messages avec ❤️ 🔥 🤗 pour montrer ton soutien.",
  "Filtre le fil par thème en haut de la page.",
  "Fais une pause avec le petit quiz santé / sport / culture.",
];

export default function OnboardingTips() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 mb-4">
      <div className="flex items-start justify-between mb-3">
        <h2
          className="text-sm font-medium flex items-center gap-2"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          <Lightbulb className="w-4 h-4" />
          Comment ça marche
        </h2>
        <button
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <ul className="space-y-1.5 mb-4">
        {TIPS.map((tip) => (
          <li key={tip} className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            {tip}
          </li>
        ))}
      </ul>
      <button
        onClick={dismiss}
        className="text-sm font-medium bg-secondary hover:opacity-80 transition-opacity px-4 py-1.5 rounded-full"
      >
        Compris
      </button>
    </div>
  );
}
