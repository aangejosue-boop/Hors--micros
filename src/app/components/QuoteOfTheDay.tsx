import { useState } from "react";
import { Quote as QuoteIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { todaysQuotes } from "../data/quotes";

const QUOTES = todaysQuotes();
const SWIPE_THRESHOLD = 60;

export default function QuoteOfTheDay() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  function go(delta: number) {
    setDirection(delta);
    setIndex((prev) => (prev + delta + QUOTES.length) % QUOTES.length);
  }

  const quote = QUOTES[index];

  return (
    <div className="bg-card rounded-2xl border border-border p-5 mb-4 overflow-hidden">
      <div className="flex items-start gap-3">
        <QuoteIcon className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <div className="relative">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={index}
                custom={direction}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -40 }}
                transition={{ duration: 0.25 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_e, info) => {
                  if (info.offset.x < -SWIPE_THRESHOLD) go(1);
                  else if (info.offset.x > SWIPE_THRESHOLD) go(-1);
                }}
                className="cursor-grab active:cursor-grabbing"
              >
                <p
                  className="text-base leading-relaxed italic"
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
                >
                  {quote.text}
                </p>
                <p className="text-xs text-muted-foreground mt-2">— {quote.author}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => go(-1)}
              aria-label="Citation précédente"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {QUOTES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > index ? 1 : -1);
                    setIndex(i);
                  }}
                  aria-label={`Citation ${i + 1}`}
                  className={`rounded-full transition-all ${
                    i === index ? "w-4 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-secondary"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => go(1)}
              aria-label="Citation suivante"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
