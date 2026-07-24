import { Quote as QuoteIcon } from "lucide-react";
import { QUOTES } from "../data/quotes";

function todaysQuote() {
  const dayIndex = Math.floor(Date.now() / 86400000);
  return QUOTES[dayIndex % QUOTES.length];
}

export default function QuoteOfTheDay() {
  const quote = todaysQuote();

  return (
    <div className="bg-card rounded-2xl border border-border p-5 mb-4">
      <div className="flex items-start gap-3">
        <QuoteIcon className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
        <div>
          <p
            className="text-base leading-relaxed italic"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
          >
            {quote.text}
          </p>
          <p className="text-xs text-muted-foreground mt-2">— {quote.author}</p>
        </div>
      </div>
    </div>
  );
}
