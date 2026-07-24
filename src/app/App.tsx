import { useState, useRef, useEffect } from "react";
import { Send, Heart, MessageCircle, Flame, Shield, ChevronDown, X, Plus, Brain, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase, type MessageRow } from "@/lib/supabase";
import { isContentAllowed, MODERATION_WARNING } from "@/lib/moderation";
import Quiz from "./components/Quiz";
import OnboardingTips from "./components/OnboardingTips";
import QuoteOfTheDay from "./components/QuoteOfTheDay";

const TAGS = [
  { id: "all", label: "Tout" },
  { id: "vie-scolaire", label: "Vie scolaire" },
  { id: "logement", label: "Logement" },
  { id: "pression", label: "Pression académique" },
  { id: "sante", label: "Santé mentale" },
  { id: "relations", label: "Relations" },
  { id: "finances", label: "Finances" },
  { id: "avenir", label: "Avenir" },
];

const CARD_ACCENTS = [
  "border-l-accent-gold",
  "border-l-accent-violet",
  "border-l-accent-mint",
  "border-l-accent-rose",
  "border-l-accent-sky",
];

type Reaction = { heart: number; fire: number; hug: number };

interface Post {
  id: number;
  text: string;
  tags: string[];
  time: string;
  reactions: Reaction;
  reacted: keyof Reaction | null;
  comments: number;
  alias: string;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60000) return "À l'instant";
  if (ms < 3600000) return `Il y a ${Math.floor(ms / 60000)} min`;
  if (ms < 86400000) return `Il y a ${Math.floor(ms / 3600000)}h`;
  return `Il y a ${Math.floor(ms / 86400000)}j`;
}

function randomAlias() {
  return `Étudiant·e anonyme #${Math.floor(1000 + Math.random() * 9000)}`;
}

const REACTED_STORAGE_KEY = "hors-micro-reactions";
const THEME_STORAGE_KEY = "hors-micro-theme";

function loadReactedMap(): Record<number, keyof Reaction> {
  try {
    return JSON.parse(localStorage.getItem(REACTED_STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function rowToPost(row: MessageRow): Post {
  return {
    id: row.id,
    text: row.content,
    tags: row.tags,
    time: timeAgo(row.created_at),
    reactions: { heart: row.heart_count, fire: row.fire_count, hug: row.hug_count },
    reacted: null,
    comments: row.comments_count,
    alias: row.alias,
  };
}

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTag, setActiveTag] = useState("all");
  const [composeOpen, setComposeOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [charCount, setCharCount] = useState(0);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [reactedMap, setReactedMap] = useState<Record<number, keyof Reaction>>({});
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const seenIds = useRef<Set<number>>(new Set());
  const MAX = 500;

  useEffect(() => {
    if (composeOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [composeOpen]);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
  }

  useEffect(() => {
    const reacted = loadReactedMap();
    setReactedMap(reacted);

    async function load() {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        console.error("Erreur de chargement des messages :", error.message);
        return;
      }
      const rows = (data ?? []) as MessageRow[];
      rows.forEach((row) => seenIds.current.add(row.id));
      setPosts(rows.map((row) => ({ ...rowToPost(row), reacted: reacted[row.id] ?? null })));
    }
    load();

    const channel = supabase
      .channel("messages-inserts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as MessageRow;
          if (seenIds.current.has(row.id)) return;
          seenIds.current.add(row.id);
          setPosts((prev) => [rowToPost(row), ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = activeTag === "all"
    ? posts
    : posts.filter((p) => p.tags.includes(activeTag));

  async function toggleReaction(id: number, type: keyof Reaction) {
    const current = reactedMap[id] ?? null;
    const already = current === type;
    const nextReacted: keyof Reaction | null = already ? null : type;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const reactions = { ...p.reactions };
        if (already) {
          reactions[type] = Math.max(0, reactions[type] - 1);
        } else {
          if (current) reactions[current] = Math.max(0, reactions[current] - 1);
          reactions[type] = reactions[type] + 1;
        }
        return { ...p, reactions, reacted: nextReacted };
      })
    );

    setReactedMap((prev) => {
      const next = { ...prev };
      if (nextReacted) next[id] = nextReacted;
      else delete next[id];
      localStorage.setItem(REACTED_STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    const calls: Promise<unknown>[] = [];
    if (already) {
      calls.push(supabase.rpc("toggle_reaction", { message_id: id, reaction: type, delta: -1 }));
    } else {
      if (current) {
        calls.push(supabase.rpc("toggle_reaction", { message_id: id, reaction: current, delta: -1 }));
      }
      calls.push(supabase.rpc("toggle_reaction", { message_id: id, reaction: type, delta: 1 }));
    }
    const results = await Promise.all(calls);
    results.forEach(({ error }: any) => {
      if (error) console.error("Erreur de réaction :", error.message);
    });
  }

  async function submitPost() {
    if (!draft.trim()) return;

    if (!isContentAllowed(draft)) {
      setModerationError(MODERATION_WARNING);
      return;
    }
    setModerationError(null);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        content: draft.trim(),
        tags: selectedTags.length ? selectedTags : ["vie-scolaire"],
        alias: randomAlias(),
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur de publication :", error.message);
      setModerationError(
        error.message.toLowerCase().includes("non autorisé")
          ? MODERATION_WARNING
          : "Une erreur est survenue, réessaie."
      );
      return;
    }

    const row = data as MessageRow;
    seenIds.current.add(row.id);
    setPosts((prev) => [rowToPost(row), ...prev]);
    setDraft("");
    setSelectedTags([]);
    setCharCount(0);
    setComposeOpen(false);
  }

  function toggleTag(id: string) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic" }}
            >
              Hors Micro
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Espace anonyme et bienveillant
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label={isDark ? "Activer le thème jour" : "Activer le thème nuit"}
              className="flex items-center justify-center bg-secondary text-foreground w-9 h-9 rounded-full hover:opacity-90 transition-opacity"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setQuizOpen(true)}
              className="flex items-center gap-2 bg-secondary text-foreground px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Brain className="w-4 h-4" />
              Quiz
            </button>
            <button
              onClick={() => setComposeOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Écrire
            </button>
          </div>
        </div>
      </header>

      {/* Tag filter */}
      <div className="sticky top-[73px] z-30 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {TAGS.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setActiveTag(tag.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm transition-all ${
                  activeTag === tag.id
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <QuoteOfTheDay />
        <OnboardingTips />
        <AnimatePresence initial={false}>
          {filtered.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className={`bg-card rounded-2xl border border-border border-l-4 ${
                CARD_ACCENTS[post.id % CARD_ACCENTS.length]
              } p-5 group`}
            >
              {/* Alias + time */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium">
                  {post.alias}
                </span>
                <span className="text-xs text-muted-foreground">{post.time}</span>
              </div>

              {/* Message */}
              <p
                className="text-base leading-relaxed text-card-foreground mb-4"
                style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
              >
                {post.text}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {post.tags.map((t) => {
                  const tag = TAGS.find((tg) => tg.id === t);
                  return tag ? (
                    <span
                      key={t}
                      className="text-xs px-2 py-0.5 bg-accent text-muted-foreground rounded-full"
                    >
                      {tag.label}
                    </span>
                  ) : null;
                })}
              </div>

              {/* Reactions */}
              <div className="flex items-center gap-4 pt-3 border-t border-border">
                <ReactionBtn
                  icon={<Heart className="w-4 h-4" />}
                  count={post.reactions.heart}
                  active={post.reacted === "heart"}
                  activeColor="text-accent-rose"
                  onClick={() => toggleReaction(post.id, "heart")}
                />
                <ReactionBtn
                  icon={<Flame className="w-4 h-4" />}
                  count={post.reactions.fire}
                  active={post.reacted === "fire"}
                  activeColor="text-accent-gold"
                  onClick={() => toggleReaction(post.id, "fire")}
                />
                <ReactionBtn
                  icon={<span className="text-sm leading-none">🤗</span>}
                  count={post.reactions.hug}
                  active={post.reacted === "hug"}
                  activeColor="text-accent-mint"
                  onClick={() => toggleReaction(post.id, "hug")}
                />
                <div className="ml-auto flex items-center gap-1.5 text-muted-foreground text-sm">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p
              className="text-2xl mb-2"
              style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic" }}
            >
              Aucun message ici
            </p>
            <p className="text-sm">Sois le premier à partager quelque chose.</p>
          </div>
        )}
      </main>

      {/* Compose overlay */}
      <AnimatePresence>
        {composeOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setComposeOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border shadow-2xl"
            >
              <div className="max-w-2xl mx-auto p-6">
                {/* Handle */}
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2
                      className="text-lg font-medium"
                      style={{ fontFamily: "'Fraunces', serif" }}
                    >
                      Ton espace, ta voix
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      100% anonyme — aucun compte requis
                    </p>
                  </div>
                  <button
                    onClick={() => setComposeOpen(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX) {
                      setDraft(e.target.value);
                      setCharCount(e.target.value.length);
                      setModerationError(null);
                    }
                  }}
                  placeholder="Partage ce que tu vis, ce que tu ressens… personne ne saura que c'est toi."
                  className="w-full bg-input-background rounded-xl p-4 text-foreground placeholder-muted-foreground resize-none outline-none border border-border focus:border-primary/50 transition-colors text-sm leading-relaxed"
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: 300, minHeight: "120px" }}
                  rows={5}
                />

                {moderationError && (
                  <p className="text-xs text-accent-rose mt-2 bg-accent-rose/10 border border-accent-rose/30 rounded-lg px-3 py-2">
                    {moderationError}
                  </p>
                )}

                <div className="flex items-center justify-between mt-1 mb-4">
                  <span className="text-xs text-muted-foreground">
                    {charCount}/{MAX}
                  </span>
                  <div className="w-24 h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all rounded-full"
                      style={{ width: `${(charCount / MAX) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Tag selection */}
                <div className="mb-5">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-widest">
                    Thèmes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TAGS.filter((t) => t.id !== "all").map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          selectedTags.includes(tag.id)
                            ? "bg-primary text-primary-foreground font-medium"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={submitPost}
                  disabled={!draft.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-medium text-sm transition-opacity disabled:opacity-40 hover:opacity-90"
                >
                  <Send className="w-4 h-4" />
                  Publier anonymement
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Quiz open={quizOpen} onClose={() => setQuizOpen(false)} />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

interface ReactionBtnProps {
  icon: React.ReactNode;
  count: number;
  active: boolean;
  activeColor: string;
  onClick: () => void;
}

function ReactionBtn({ icon, count, active, activeColor, onClick }: ReactionBtnProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-sm transition-all hover:scale-110 active:scale-95 ${
        active ? activeColor : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span className={active ? "font-medium" : ""}>{count}</span>
    </button>
  );
}
