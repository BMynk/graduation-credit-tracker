import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  LoaderCircle,
  RotateCcw,
  Send,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { api } from "../../api";

/* ============================================================
   MARCEL BRAND
============================================================ */

const MARCEL_NAME = "Marcel";

const WELCOME_MESSAGE = {
  role: "model",
  text:
    "Hi! I'm **Marcel**, your academic assistant. 👋\n\n" +
    "I can help you understand your academic progress, plan your modules, " +
    "check prerequisites, find facilitator information, and navigate university services.",
};

/* ============================================================
   ROLE-AWARE SUGGESTIONS
============================================================ */

const GUEST_SUGGESTIONS = [
  {
    icon: GraduationCap,
    label: "Graduation progress",
    prompt: "How does graduation progress tracking work?",
  },
  {
    icon: BookOpen,
    label: "University credits",
    prompt: "How do university credits work?",
  },
  {
    icon: Users,
    label: "Find a facilitator",
    prompt: "Can you help me find a facilitator?",
  },
  {
    icon: Sparkles,
    label: "What Marcel can do",
    prompt: "What can you help me with?",
  },
];

const STUDENT_SUGGESTIONS = [
  {
    icon: GraduationCap,
    label: "Check my progress",
    prompt: "Am I on track to graduate?",
  },
  {
    icon: BookOpen,
    label: "Modules I can take",
    prompt: "What modules can I take next?",
  },
  {
    icon: CalendarDays,
    label: "Plan my semester",
    prompt: "Help me plan my next semester.",
  },
  {
    icon: Users,
    label: "Find a facilitator",
    prompt: "Can you help me find one of my module facilitators?",
  },
];

const ADMIN_SUGGESTIONS = [
  {
    icon: Users,
    label: "Student support",
    prompt: "How can I identify students who may need academic support?",
  },
  {
    icon: GraduationCap,
    label: "Graduation tracking",
    prompt: "Explain how graduation progress is calculated.",
  },
  {
    icon: BookOpen,
    label: "Curriculum help",
    prompt: "How does curriculum and prerequisite management work?",
  },
  {
    icon: Sparkles,
    label: "What Marcel can do",
    prompt: "What can you help administrators with?",
  },
];

/* ============================================================
   MARCEL LOGO
============================================================ */

function MarcelLogo({
  size = "md",
  animated = false,
  thinking = false,
}) {
  const sizes = {
    sm: "h-9 w-9",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-[92px] w-[92px]",
  };

  const ringSpeed = thinking ? 1.15 : 5.5;
  const reverseRingSpeed = thinking ? 0.9 : 7;

  return (
    <motion.div
      className={`${sizes[size] || sizes.md} relative shrink-0`}
      animate={animated ? { y: [0, -2, 0] } : undefined}
      transition={
        animated
          ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
          : undefined
      }
      aria-hidden="true"
    >
      {/* Soft ambient glow */}
      <motion.div
        className="absolute inset-[8%] rounded-full bg-blue-500/25 blur-lg"
        animate={{
          scale: thinking ? [0.9, 1.28, 0.9] : [0.96, 1.08, 0.96],
          opacity: thinking ? [0.3, 0.75, 0.3] : [0.22, 0.42, 0.22],
        }}
        transition={{
          duration: thinking ? 0.9 : 3.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Outer glass shell */}
      <div className="absolute inset-[7%] rounded-full border border-cyan-200/40 bg-gradient-to-br from-slate-950 via-[#101b45] to-[#071126] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_6px_20px_rgba(37,99,235,0.28)]" />

      {/* Energy rings */}
      <motion.div
        className="absolute inset-[1%] rounded-full border border-transparent border-l-cyan-300/80 border-t-blue-400/70"
        animate={{ rotate: 360 }}
        transition={{ duration: ringSpeed, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-[18%] rounded-full border border-transparent border-b-indigo-300/80 border-r-cyan-300/80"
        animate={{ rotate: -360 }}
        transition={{ duration: reverseRingSpeed, repeat: Infinity, ease: "linear" }}
      />

      {/* Orbital particles */}
      <motion.div
        className="absolute inset-[5%]"
        animate={{ rotate: 360 }}
        transition={{ duration: thinking ? 1.3 : 6.5, repeat: Infinity, ease: "linear" }}
      >
        <span className="absolute left-1/2 top-0 h-[9%] w-[9%] -translate-x-1/2 rounded-full bg-cyan-200 shadow-[0_0_8px_rgba(103,232,249,0.95)]" />
        <span className="absolute bottom-[8%] right-[2%] h-[6%] w-[6%] rounded-full bg-blue-300 shadow-[0_0_7px_rgba(147,197,253,0.9)]" />
      </motion.div>

      {/* Friendly AI face core */}
      <motion.div
        className="absolute inset-[24%] z-10 overflow-hidden rounded-full border border-cyan-100/30 bg-gradient-to-br from-[#15265c] via-[#0d183c] to-[#071126] shadow-[0_0_16px_rgba(34,211,238,0.55),inset_0_0_14px_rgba(59,130,246,0.22)]"
        animate={{
          scale: thinking ? [0.94, 1.08, 0.94] : [0.98, 1.02, 0.98],
          boxShadow: thinking
            ? [
                "0 0 12px rgba(34,211,238,.45), inset 0 0 12px rgba(59,130,246,.2)",
                "0 0 24px rgba(34,211,238,.9), inset 0 0 18px rgba(59,130,246,.35)",
                "0 0 12px rgba(34,211,238,.45), inset 0 0 12px rgba(59,130,246,.2)",
              ]
            : undefined,
        }}
        transition={{ duration: thinking ? 0.8 : 2.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute left-[20%] top-[15%] h-[22%] w-[36%] -rotate-[25deg] rounded-full bg-white/10 blur-[1px]" />

        {/* Eyes */}
        <div className="absolute left-1/2 top-[35%] flex w-[54%] -translate-x-1/2 items-center justify-between">
          {[0, 1].map((eye) => (
            <motion.span
              key={eye}
              className="h-[18%] min-h-[3px] w-[24%] min-w-[4px] rounded-full bg-cyan-100 shadow-[0_0_7px_2px_rgba(103,232,249,0.9)]"
              animate={
                thinking
                  ? { scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }
                  : { scaleY: [1, 1, 1, 0.12, 1] }
              }
              transition={
                thinking
                  ? { duration: 0.7, repeat: Infinity, delay: eye * 0.08 }
                  : { duration: 5.2, repeat: Infinity, times: [0, 0.9, 0.92, 0.94, 1], delay: eye * 0.04 }
              }
            />
          ))}
        </div>

        {/* Smile */}
        <motion.div
          className="absolute bottom-[27%] left-1/2 h-[16%] w-[34%] -translate-x-1/2 rounded-b-full border-b-2 border-cyan-100/90 shadow-[0_2px_5px_rgba(103,232,249,0.35)]"
          animate={thinking ? { scaleX: [0.85, 1.08, 0.85] } : undefined}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Small forehead spark gives Marcel a recognizable mark */}
      <motion.span
        className="absolute left-1/2 top-[21%] z-20 h-[7%] w-[7%] -translate-x-1/2 rotate-45 rounded-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)]"
        animate={thinking ? { scale: [0.8, 1.35, 0.8], opacity: [0.65, 1, 0.65] } : { opacity: [0.65, 1, 0.65] }}
        transition={{ duration: thinking ? 0.8 : 2.6, repeat: Infinity, ease: "easeInOut" }}
      />

      {size === "xl" && (
        <>
          <motion.span
            className="absolute -left-1 top-[22%] h-2 w-2 rounded-full bg-cyan-300/80 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
            animate={{ y: [0, -6, 0], x: [0, 3, 0], opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            className="absolute -right-1 bottom-[24%] h-1.5 w-1.5 rounded-full bg-indigo-300/80"
            animate={{ y: [0, 5, 0], x: [0, -3, 0], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}
    </motion.div>
  );
}

/* ============================================================
   MARKDOWN
============================================================ */

function MarcelMarkdown({ children }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children: content }) => (
          <p className="mb-2.5 last:mb-0">{content}</p>
        ),

        strong: ({ children: content }) => (
          <strong className="font-semibold text-zinc-950 dark:text-white">
            {content}
          </strong>
        ),

        ul: ({ children: content }) => (
          <ul className="my-2.5 list-disc space-y-1.5 pl-5">
            {content}
          </ul>
        ),

        ol: ({ children: content }) => (
          <ol className="my-2.5 list-decimal space-y-1.5 pl-5">
            {content}
          </ol>
        ),

        li: ({ children: content }) => (
          <li className="pl-0.5">{content}</li>
        ),

        h1: ({ children: content }) => (
          <h1 className="mb-2.5 text-base font-semibold text-zinc-950 dark:text-white">
            {content}
          </h1>
        ),

        h2: ({ children: content }) => (
          <h2 className="mb-2 mt-4 text-sm font-semibold text-zinc-950 dark:text-white">
            {content}
          </h2>
        ),

        h3: ({ children: content }) => (
          <h3 className="mb-1.5 mt-3 text-sm font-semibold text-zinc-950 dark:text-white">
            {content}
          </h3>
        ),

        code: ({ children: content }) => (
          <code
            className="
              rounded-md bg-zinc-100 px-1.5 py-0.5
              text-[12px] text-zinc-800
              dark:bg-zinc-800 dark:text-zinc-200
            "
          >
            {content}
          </code>
        ),

        blockquote: ({ children: content }) => (
          <blockquote
            className="
              my-3 border-l-2 border-indigo-400
              bg-indigo-50/60 py-2 pl-3 pr-2
              text-zinc-600
              dark:bg-indigo-950/20
              dark:text-zinc-300
            "
          >
            {content}
          </blockquote>
        ),

        a: ({ href, children: content }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="
              font-medium text-indigo-600
              underline decoration-indigo-300
              underline-offset-2
              transition hover:text-indigo-700
              dark:text-indigo-400
              dark:hover:text-indigo-300
            "
          >
            {content}
          </a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function AssistantWidget({ userRole = "guest" }) {
  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState([
    WELCOME_MESSAGE,
  ]);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [streamStarted, setStreamStarted] =
    useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const launcherDraggedRef = useRef(false);
  const [launcherPosition, setLauncherPosition] = useState(() => {
    if (typeof window === "undefined") return { x: 0, y: 0 };

    try {
      const saved = window.sessionStorage.getItem("marcel-launcher-position");
      return saved ? JSON.parse(saved) : { x: 0, y: 0 };
    } catch {
      return { x: 0, y: 0 };
    }
  });

  function clampLauncherPosition(position) {
    if (typeof window === "undefined") return position;

    const viewport = window.visualViewport;
    const width = viewport?.width || window.innerWidth;
    const height = viewport?.height || window.innerHeight;
    const margin = 16;
    const launcherSize = 64;

    return {
      x: Math.min(0, Math.max(position.x, -(width - launcherSize - margin * 2))),
      y: Math.min(0, Math.max(position.y, -(height - launcherSize - margin * 2))),
    };
  }

  function saveLauncherPosition(position) {
    const next = clampLauncherPosition(position);
    setLauncherPosition(next);

    try {
      window.sessionStorage.setItem(
        "marcel-launcher-position",
        JSON.stringify(next),
      );
    } catch {
      // Storage can be unavailable in private/restricted browser modes.
    }
  }

  const suggestions = useMemo(() => {
    if (userRole === "student") {
      return STUDENT_SUGGESTIONS;
    }

    if (userRole === "admin") {
      return ADMIN_SUGGESTIONS;
    }

    return GUEST_SUGGESTIONS;
  }, [userRole]);

  const roleLabel =
    userRole === "student"
      ? "Student assistant"
      : userRole === "admin"
        ? "Admin assistant"
        : "Academic assistant";

  /* ============================================================
     AUTO SCROLL
  ============================================================ */

  useEffect(() => {
    if (!isOpen) return;

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, sending, isOpen]);

  /* ============================================================
     FOCUS INPUT
  ============================================================ */

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 250);

    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const keepLauncherOnScreen = () => {
      setLauncherPosition((current) => {
        const next = clampLauncherPosition(current);

        try {
          window.sessionStorage.setItem(
            "marcel-launcher-position",
            JSON.stringify(next),
          );
        } catch {
          // Ignore storage failures.
        }

        return next;
      });
    };

    window.addEventListener("resize", keepLauncherOnScreen);
    window.visualViewport?.addEventListener("resize", keepLauncherOnScreen);

    return () => {
      window.removeEventListener("resize", keepLauncherOnScreen);
      window.visualViewport?.removeEventListener("resize", keepLauncherOnScreen);
    };
  }, []);

  /* ============================================================
     SEND MESSAGE - STREAMING
  ============================================================ */

  async function sendMessage(textOverride) {
    const text = (textOverride ?? input).trim();

    if (!text || sending) return;

    const userMessage = {
      role: "user",
      text,
    };

    const conversationHistory = messages
      .slice(1)
      .slice(-10);

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setInput("");
    setError("");
    setSending(true);
    setStreamStarted(false);

    let hasStartedStreaming = false;

    try {
      await api.assistantChatStream(
        {
          message: text,
          user_role: userRole,
          history: conversationHistory,
        },
        (chunk) => {
          if (!chunk) return;

          if (!hasStartedStreaming) {
            hasStartedStreaming = true;
            setStreamStarted(true);

            setMessages((current) => [
              ...current,
              {
                role: "model",
                text: chunk,
              },
            ]);

            return;
          }

          setMessages((current) => {
            const updated = [...current];
            const lastIndex = updated.length - 1;
            const lastMessage = updated[lastIndex];

            if (
              lastMessage &&
              lastMessage.role === "model"
            ) {
              updated[lastIndex] = {
                ...lastMessage,
                text: lastMessage.text + chunk,
              };
            }

            return updated;
          });
        },
      );

      if (!hasStartedStreaming) {
        setError(
          "Marcel didn't return a response. Please try again.",
        );
      }
    } catch (err) {
      setError(
        err?.message ||
          "Marcel is temporarily unavailable. Please try again.",
      );
    } finally {
      setSending(false);
      setStreamStarted(false);
    }
  }

  /* ============================================================
     SUBMIT
  ============================================================ */

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  /* ============================================================
     NEW CHAT
  ============================================================ */

  function startNewChat() {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setError("");

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.section
            initial={{
              opacity: 0,
              y: 30,
              scale: 0.94,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 24,
              scale: 0.95,
            }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 28,
            }}
            className="
              fixed bottom-24 right-6 z-[100]
              flex h-[680px] w-[430px]
              max-h-[calc(100vh-120px)]
              flex-col overflow-hidden
              rounded-[30px]
              border border-zinc-200/80
              bg-white
              shadow-[0_24px_80px_-20px_rgba(15,23,42,0.35)]
              dark:border-white/10
              dark:bg-zinc-950

              max-sm:bottom-0
              max-sm:right-0
              max-sm:h-[100dvh]
              max-sm:max-h-none
              max-sm:w-full
              max-sm:rounded-none
              max-sm:border-0
            "
          >
            {/* ==================================================
                MARCEL HEADER
            ================================================== */}

            <header
              className="
                relative overflow-hidden
                border-b border-zinc-200/80
                bg-white px-4 py-3.5
                dark:border-white/10
                dark:bg-zinc-950
              "
            >
              <div
                className="
                  pointer-events-none absolute
                  -right-10 -top-16
                  h-36 w-36 rounded-full
                  bg-indigo-500/10 blur-3xl
                "
              />

              <div
                className="
                  pointer-events-none absolute
                  -left-12 -top-20
                  h-32 w-32 rounded-full
                  bg-blue-500/10 blur-3xl
                "
              />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MarcelLogo size="md" animated />

                  <div>
                    <div className="flex items-center gap-2">
                      <h2
                        className="
                          text-[15px] font-semibold
                          tracking-[-0.01em]
                          text-zinc-950
                          dark:text-white
                        "
                      >
                        {MARCEL_NAME}
                      </h2>

                      <span
                        className="
                          inline-flex items-center gap-1
                          rounded-full
                          bg-indigo-50
                          px-2 py-0.5
                          text-[9px] font-semibold
                          uppercase tracking-[0.08em]
                          text-indigo-600
                          dark:bg-indigo-500/10
                          dark:text-indigo-300
                        "
                      >
                        <Sparkles size={9} />
                        AI
                      </span>
                    </div>

                    <div
                      className="
                        mt-0.5 flex items-center gap-1.5
                        text-[11px] text-zinc-500
                        dark:text-zinc-400
                      "
                    >
                      <span className="relative flex h-2 w-2">
                        <span
                          className="
                            absolute inline-flex h-full w-full
                            animate-ping rounded-full
                            bg-emerald-400 opacity-50
                          "
                        />
                        <span
                          className="
                            relative inline-flex h-2 w-2
                            rounded-full bg-emerald-500
                          "
                        />
                      </span>

                      <span>{roleLabel}</span>

<span className="text-zinc-300 dark:text-zinc-700">
  •
</span>

<span className="inline-flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
  <Sparkles size={10} />
  Powered by Gemini
</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {messages.length > 1 && (
                    <button
                      type="button"
                      onClick={startNewChat}
                      title="Start a new chat"
                      className="
                        flex h-9 w-9 items-center justify-center
                        rounded-xl text-zinc-400
                        transition-all duration-200
                        hover:bg-zinc-100
                        hover:text-zinc-900
                        dark:hover:bg-white/10
                        dark:hover:text-white
                      "
                    >
                      <RotateCcw size={16} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    title="Close Marcel"
                    className="
                      flex h-9 w-9 items-center justify-center
                      rounded-xl text-zinc-400
                      transition-all duration-200
                      hover:bg-zinc-100
                      hover:text-zinc-900
                      dark:hover:bg-white/10
                      dark:hover:text-white
                    "
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </header>

            {/* ==================================================
                MESSAGES
            ================================================== */}

            <div
              className="
                flex-1 overflow-y-auto
                bg-gradient-to-b
                from-zinc-50/90
                via-white
                to-white
                px-4 py-5

                dark:from-zinc-950
                dark:via-zinc-950
                dark:to-zinc-950
              "
            >
              <div className="space-y-5">
                {messages.map((message, index) => {
                  const isUser =
                    message.role === "user";

                  const isWelcome =
                    index === 0 &&
                    !isUser &&
                    messages.length === 1;

                  if (isWelcome) {
                    return (
                      <motion.div
                        key="marcel-welcome"
                        initial={{
                          opacity: 0,
                          y: 10,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay: 0.08,
                        }}
                        className="pt-2"
                      >
                        <div className="flex flex-col items-center text-center">
                          <MarcelLogo
                            size="xl"
                            animated
                          />

                          <div className="mt-4">
                            <h3
                              className="
                                text-xl font-semibold
                                tracking-[-0.03em]
                                text-zinc-950
                                dark:text-white
                              "
                            >
                              Meet Marcel
                            </h3>

                            <p
                              className="
                                mt-1 text-xs font-medium
                                text-indigo-600
                                dark:text-indigo-400
                              "
                            >
                              Your academic assistant
                            </p>
                            <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
  <Sparkles size={11} />
  <span>Powered by Gemini</span>
</div>
                          </div>

                          <div
                            className="
                              mt-4 max-w-[330px]
                              text-[13px] leading-6
                              text-zinc-500
                              dark:text-zinc-400
                            "
                          >
                            <MarcelMarkdown>
                              {message.text}
                            </MarcelMarkdown>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={`${message.role}-${index}`}
                      initial={{
                        opacity: 0,
                        y: 8,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.2,
                      }}
                      className={
                        isUser
                          ? "flex justify-end"
                          : "flex justify-start"
                      }
                    >
                      {!isUser && (
                        <div className="mr-2 mt-1">
                          <MarcelLogo size="sm" />
                        </div>
                      )}

                      <div
                        className={
                          isUser
                            ? `
                              max-w-[82%]
                              whitespace-pre-wrap
                              rounded-[20px]
                              rounded-br-md
                              bg-gradient-to-br
                              from-blue-600
                              to-indigo-600
                              px-4 py-3
                              text-[13px]
                              leading-6
                              text-white
                              shadow-md
                              shadow-indigo-500/10
                            `
                            : `
                              max-w-[84%]
                              rounded-[20px]
                              rounded-bl-md
                              border
                              border-zinc-200/80
                              bg-white
                              px-4 py-3
                              text-[13px]
                              leading-6
                              text-zinc-700
                              shadow-sm
                              dark:border-white/10
                              dark:bg-zinc-900
                              dark:text-zinc-200
                            `
                        }
                      >
                        {isUser ? (
                          message.text
                        ) : (
                          <MarcelMarkdown>
                            {message.text}
                          </MarcelMarkdown>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {/* ================================================
                    QUICK SUGGESTIONS
                ================================================ */}

                {messages.length === 1 && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay: 0.18,
                    }}
                    className="pt-1"
                  >
                    <div
                      className="
                        mb-2.5 flex items-center
                        justify-between px-1
                      "
                    >
                      <p
                        className="
                          text-[10px] font-semibold
                          uppercase tracking-[0.12em]
                          text-zinc-400
                        "
                      >
                        Try asking Marcel
                      </p>

                      <span
                        className="
                          text-[10px]
                          text-zinc-400
                        "
                      >
                        Quick actions
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {suggestions.map(
                        ({
                          icon: Icon,
                          label,
                          prompt,
                        }) => (
                          <motion.button
                            key={label}
                            type="button"
                            disabled={sending}
                            onClick={() =>
                              sendMessage(prompt)
                            }
                            whileHover={{
                              y: -2,
                            }}
                            whileTap={{
                              scale: 0.98,
                            }}
                            className="
                              group relative
                              overflow-hidden
                              rounded-2xl
                              border border-zinc-200
                              bg-white
                              p-3
                              text-left
                              transition
                              hover:border-indigo-200
                              hover:shadow-md
                              hover:shadow-indigo-500/5

                              disabled:cursor-not-allowed
                              disabled:opacity-50

                              dark:border-white/10
                              dark:bg-zinc-900
                              dark:hover:border-indigo-500/30
                            "
                          >
                            <div
                              className="
                                mb-2 flex h-8 w-8
                                items-center justify-center
                                rounded-xl
                                bg-zinc-100
                                text-zinc-600
                                transition
                                group-hover:bg-indigo-50
                                group-hover:text-indigo-600

                                dark:bg-white/5
                                dark:text-zinc-300
                                dark:group-hover:bg-indigo-500/10
                                dark:group-hover:text-indigo-300
                              "
                            >
                              <Icon size={15} />
                            </div>

                            <p
                              className="
                                text-[11px]
                                font-medium
                                leading-4
                                text-zinc-700
                                dark:text-zinc-200
                              "
                            >
                              {label}
                            </p>
                          </motion.button>
                        ),
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ================================================
                    THINKING
                ================================================ */}

                {sending && !streamStarted && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 6,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="flex justify-start"
                  >
                    <div className="mr-2 mt-1">
                      <MarcelLogo
                      size="sm"
                      animated
                      thinking
                      />
                    </div>

                    <div
                      className="
                        flex items-center gap-3
                        rounded-[20px]
                        rounded-bl-md
                        border border-zinc-200/80
                        bg-white
                        px-4 py-3
                        text-xs
                        text-zinc-500
                        shadow-sm

                        dark:border-white/10
                        dark:bg-zinc-900
                        dark:text-zinc-400
                      "
                    >
                      <div className="flex items-center gap-1">
                        {[0, 1, 2].map((dot) => (
                          <motion.span
                            key={dot}
                            animate={{
                              y: [0, -4, 0],
                              opacity: [
                                0.4,
                                1,
                                0.4,
                              ],
                            }}
                            transition={{
                              duration: 0.9,
                              repeat: Infinity,
                              delay: dot * 0.15,
                            }}
                            className="
                              h-1.5 w-1.5
                              rounded-full
                              bg-indigo-500
                            "
                          />
                        ))}
                      </div>

                      Marcel is thinking...
                    </div>
                  </motion.div>
                )}

                {/* ================================================
                    ERROR
                ================================================ */}

                {error && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 5,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="
                      rounded-2xl
                      border border-red-200
                      bg-red-50
                      px-3.5 py-3
                      text-xs
                      text-red-700

                      dark:border-red-900/50
                      dark:bg-red-950/30
                      dark:text-red-300
                    "
                  >
                    {error}
                  </motion.div>
                )}

                <div ref={bottomRef} />
              </div>
            </div>

            {/* ==================================================
                INPUT
            ================================================== */}

            <footer
              className="
                border-t
                border-zinc-200/80
                bg-white
                p-3
                dark:border-white/10
                dark:bg-zinc-950
              "
            >
              <form
                onSubmit={handleSubmit}
                className="
                  relative
                  flex items-end gap-2
                  rounded-[20px]
                  border border-zinc-200
                  bg-zinc-50
                  p-2
                  transition-all

                  focus-within:border-indigo-400
                  focus-within:bg-white
                  focus-within:ring-4
                  focus-within:ring-indigo-500/10

                  dark:border-white/10
                  dark:bg-zinc-900
                  dark:focus-within:border-indigo-500/60
                  dark:focus-within:bg-zinc-900
                "
              >
                <div
                  className="
                    mb-1 ml-1 flex
                    h-7 w-7 shrink-0
                    items-center justify-center
                    rounded-lg
                    text-indigo-500
                  "
                >
                  <Sparkles size={15} />
                </div>

                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) =>
                    setInput(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  rows={1}
                  maxLength={4000}
                  placeholder="Ask Marcel anything..."
                  className="
                    max-h-28
                    min-h-10
                    flex-1
                    resize-none
                    bg-transparent
                    px-1 py-2
                    text-[13px]
                    leading-5
                    text-zinc-900
                    outline-none
                    placeholder:text-zinc-400
                    dark:text-white
                  "
                />

                <motion.button
                  type="submit"
                  disabled={
                    !input.trim() || sending
                  }
                  whileHover={
                    input.trim() && !sending
                      ? { scale: 1.04 }
                      : {}
                  }
                  whileTap={
                    input.trim() && !sending
                      ? { scale: 0.94 }
                      : {}
                  }
                  className="
                    flex h-10 w-10
                    shrink-0
                    items-center justify-center
                    rounded-xl
                    bg-gradient-to-br
                    from-blue-600
                    to-indigo-600
                    text-white
                    shadow-md
                    shadow-indigo-500/20
                    transition

                    hover:from-blue-700
                    hover:to-indigo-700

                    disabled:cursor-not-allowed
                    disabled:opacity-35
                    disabled:shadow-none
                  "
                  aria-label="Send message to Marcel"
                >
                  {sending ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Send size={16} />
                  )}
                </motion.button>
              </form>

              <div
                className="
                  mt-2 flex items-center
                  justify-center gap-1.5
                  px-1 text-center
                  text-[9px]
                  text-zinc-400
                "
              >
                <CheckCircle2 size={10} />

                <span>
                  Marcel can make mistakes. Verify important
                  academic information.
                </span>
              </div>
            </footer>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ========================================================
          MARCEL FLOATING LAUNCHER
      ======================================================== */}

      <div
        className="
          fixed bottom-6 right-6
          z-[101]
          flex items-center gap-2.5
          max-sm:bottom-4
          max-sm:right-4
        "
      >
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{
                opacity: 0,
                x: 10,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                x: 10,
                scale: 0.95,
              }}
              transition={{
                duration: 0.2,
              }}
              className="
                pointer-events-none
                rounded-full
                border border-zinc-200/80
                bg-white/95
                px-3.5 py-2
                text-xs font-medium
                text-zinc-700
                shadow-lg
                shadow-black/5
                backdrop-blur-xl

                dark:border-white/10
                dark:bg-zinc-900/95
                dark:text-zinc-200

                max-sm:hidden
              "
            >
              Ask Marcel anything
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          drag={!isOpen}
          dragMomentum={false}
          dragElastic={0.08}
          style={{
            x: launcherPosition.x,
            y: launcherPosition.y,
            touchAction: "none",
          }}
          onDragStart={() => {
            launcherDraggedRef.current = false;
          }}
          onDrag={(_, info) => {
            if (
              Math.abs(info.offset.x) > 6 ||
              Math.abs(info.offset.y) > 6
            ) {
              launcherDraggedRef.current = true;
            }
          }}
          onDragEnd={(_, info) => {
            saveLauncherPosition({
              x: launcherPosition.x + info.offset.x,
              y: launcherPosition.y + info.offset.y,
            });
          }}
          onClick={() => {
            if (launcherDraggedRef.current) {
              launcherDraggedRef.current = false;
              return;
            }

            setIsOpen((current) => !current);
          }}
          whileHover={{
            scale: 1.06,
          }}
          whileTap={{
            scale: 0.94,
          }}
          whileDrag={{
            scale: 1.06,
            cursor: "grabbing",
          }}
          className="
            relative
            flex h-[64px] w-[64px]
            items-center justify-center
            overflow-visible
            rounded-[22px]
            border border-white/10
            bg-[#081126]
            text-white
            shadow-[0_16px_40px_-10px_rgba(37,99,235,0.7)]
            backdrop-blur-xl
            cursor-grab
            select-none
          "
          aria-label={
            isOpen
              ? "Close Marcel"
              : "Open Marcel"
          }
        >
          {!isOpen && (
            <>
              <motion.span
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.35, 0, 0.35],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className="
                  absolute inset-0
                  rounded-[20px]
                  border border-indigo-400
                "
              />

              <div
                className="
                  absolute right-0 top-0
                  h-2.5 w-2.5
                  translate-x-0.5
                  -translate-y-0.5
                  rounded-full
                  border-2 border-white
                  bg-emerald-500
                  dark:border-zinc-950
                "
              />
            </>
          )}

          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{
                  opacity: 0,
                  rotate: -90,
                  scale: 0.8,
                }}
                animate={{
                  opacity: 1,
                  rotate: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  rotate: 90,
                  scale: 0.8,
                }}
                transition={{
                  duration: 0.16,
                }}
              >
                <X size={22} />
              </motion.div>
            ) : (
              <motion.div
                key="marcel"
                initial={{
                  opacity: 0,
                  scale: 0.7,
                  rotate: -15,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.7,
                  rotate: 15,
                }}
                transition={{
                  duration: 0.18,
                }}
              >
                <MarcelLogo
              size="md"
              animated
              />
              
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
}