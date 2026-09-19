import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

import {
  Bot,
  GraduationCap,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import { api } from "../../api";


const WELCOME_MESSAGE = {
  role: "model",
  text: "Hi! I'm the Graduation Credit Tracker Assistant. How can I help you today?",
};


const SUGGESTIONS = [
  "What is the Graduation Credit Tracker?",
  "How do university credits work?",
  "How can I track my graduation progress?",
  "What can you help me with?",
];


export default function AssistantWidget({
  userRole = "guest",
}) {
  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState([
    WELCOME_MESSAGE,
  ]);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [streamStarted, setStreamStarted] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);


  // ----------------------------------------------------------
  // Scroll to newest message
  // ----------------------------------------------------------

  useEffect(() => {
    if (!isOpen) return;

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, sending, isOpen]);


  // ----------------------------------------------------------
  // Focus input when assistant opens
  // ----------------------------------------------------------

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 200);

    return () => clearTimeout(timer);
  }, [isOpen]);


  // ----------------------------------------------------------
// Send message - streaming
// ----------------------------------------------------------

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
      }
    );

    if (!hasStartedStreaming) {
      setError(
        "The assistant didn't return a response. Please try again."
      );
    }
  } catch (err) {
    setError(
      err?.message ||
        "The assistant is temporarily unavailable."
    );
  } finally {
    setSending(false);
    setStreamStarted(false);
  }
}


  // ----------------------------------------------------------
  // Submit
  // ----------------------------------------------------------

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }


  // ----------------------------------------------------------
  // New chat
  // ----------------------------------------------------------

  function startNewChat() {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setError("");
  }


  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.section
            initial={{
              opacity: 0,
              y: 24,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 20,
              scale: 0.96,
            }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            className="
              fixed bottom-24 right-6 z-[100]
              flex h-[620px] w-[400px]
              max-h-[calc(100vh-120px)]
              flex-col overflow-hidden
              rounded-[28px]
              border border-zinc-200
              bg-white
              shadow-2xl shadow-black/20
              dark:border-zinc-800
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
                HEADER
            ================================================== */}

            <header
              className="
                flex items-center justify-between
                border-b border-zinc-200
                bg-white px-4 py-4
                dark:border-zinc-800
                dark:bg-zinc-950
              "
            >
              <div className="flex items-center gap-3">

                <div
                  className="
                    flex h-11 w-11
                    items-center justify-center
                    rounded-2xl
                    bg-blue-600
                    text-white
                    shadow-sm
                  "
                >
                  <GraduationCap size={22} />
                </div>


                <div>
                  <div
                    className="
                      flex items-center gap-1.5
                      text-sm font-semibold
                      text-zinc-950
                      dark:text-white
                    "
                  >
                    GCT Assistant

                    <Sparkles
                      size={14}
                      className="text-blue-500"
                    />
                  </div>


                  <div
                    className="
                      mt-0.5
                      flex items-center gap-1.5
                      text-xs
                      text-zinc-500
                      dark:text-zinc-400
                    "
                  >
                    <span
                      className="
                        h-1.5 w-1.5
                        rounded-full
                        bg-emerald-500
                      "
                    />

                    Powered by Gemini
                  </div>
                </div>
              </div>


              <div className="flex items-center gap-1">

                {messages.length > 1 && (
                  <button
                    type="button"
                    onClick={startNewChat}
                    title="New chat"
                    className="
                      rounded-xl p-2
                      text-zinc-500
                      transition
                      hover:bg-zinc-100
                      hover:text-zinc-900
                      dark:hover:bg-zinc-900
                      dark:hover:text-white
                    "
                  >
                    <RotateCcw size={17} />
                  </button>
                )}


                <button
                  type="button"
                  onClick={() =>
                    setIsOpen(false)
                  }
                  title="Close assistant"
                  className="
                    rounded-xl p-2
                    text-zinc-500
                    transition
                    hover:bg-zinc-100
                    hover:text-zinc-900
                    dark:hover:bg-zinc-900
                    dark:hover:text-white
                  "
                >
                  <X size={19} />
                </button>

              </div>
            </header>


            {/* ==================================================
                MESSAGES
            ================================================== */}

            <div
              className="
                flex-1 overflow-y-auto
                bg-zinc-50/70
                px-4 py-5
                dark:bg-zinc-950
              "
            >
              <div className="space-y-4">

                {messages.map(
                  (message, index) => {
                    const isUser =
                      message.role === "user";

                    return (
                      <motion.div
                        key={`${message.role}-${index}`}
                        initial={{
                          opacity: 0,
                          y: 6,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        className={
                          isUser
                            ? "flex justify-end"
                            : "flex justify-start"
                        }
                      >

                        {/* Assistant icon */}

                        {!isUser && (
                          <div
                            className="
                              mr-2 mt-1
                              flex h-7 w-7
                              shrink-0
                              items-center
                              justify-center
                              rounded-lg
                              bg-blue-100
                              text-blue-600
                              dark:bg-blue-950
                              dark:text-blue-400
                            "
                          >
                            <Bot size={15} />
                          </div>
                        )}


                        {/* Message bubble */}

                        <div
                          className={
                            isUser
                              ? `
                                max-w-[82%]
                                whitespace-pre-wrap
                                rounded-2xl
                                rounded-br-md
                                bg-blue-600
                                px-4 py-3
                                text-sm
                                leading-6
                                text-white
                              `
                              : `
                                max-w-[82%]
                                rounded-2xl
                                rounded-bl-md
                                border
                                border-zinc-200
                                bg-white
                                px-4 py-3
                                text-sm
                                leading-6
                                text-zinc-700
                                shadow-sm
                                dark:border-zinc-800
                                dark:bg-zinc-900
                                dark:text-zinc-200
                              `
                          }
                        >

                          {isUser ? (
                            message.text
                          ) : (
                            <ReactMarkdown
                              components={{
                                p: ({
                                  children,
                                }) => (
                                  <p className="mb-2 last:mb-0">
                                    {children}
                                  </p>
                                ),

                                strong: ({
                                  children,
                                }) => (
                                  <strong
                                    className="
                                      font-semibold
                                      text-zinc-950
                                      dark:text-white
                                    "
                                  >
                                    {children}
                                  </strong>
                                ),

                                ul: ({
                                  children,
                                }) => (
                                  <ul
                                    className="
                                      my-2
                                      list-disc
                                      space-y-1
                                      pl-5
                                    "
                                  >
                                    {children}
                                  </ul>
                                ),

                                ol: ({
                                  children,
                                }) => (
                                  <ol
                                    className="
                                      my-2
                                      list-decimal
                                      space-y-1
                                      pl-5
                                    "
                                  >
                                    {children}
                                  </ol>
                                ),

                                li: ({
                                  children,
                                }) => (
                                  <li className="pl-0.5">
                                    {children}
                                  </li>
                                ),

                                h1: ({
                                  children,
                                }) => (
                                  <h1
                                    className="
                                      mb-2
                                      text-base
                                      font-semibold
                                      text-zinc-950
                                      dark:text-white
                                    "
                                  >
                                    {children}
                                  </h1>
                                ),

                                h2: ({
                                  children,
                                }) => (
                                  <h2
                                    className="
                                      mb-2 mt-3
                                      text-sm
                                      font-semibold
                                      text-zinc-950
                                      dark:text-white
                                    "
                                  >
                                    {children}
                                  </h2>
                                ),

                                h3: ({
                                  children,
                                }) => (
                                  <h3
                                    className="
                                      mb-1 mt-2
                                      text-sm
                                      font-semibold
                                      text-zinc-950
                                      dark:text-white
                                    "
                                  >
                                    {children}
                                  </h3>
                                ),

                                code: ({
                                  children,
                                }) => (
                                  <code
                                    className="
                                      rounded
                                      bg-zinc-100
                                      px-1 py-0.5
                                      text-xs
                                      dark:bg-zinc-800
                                    "
                                  >
                                    {children}
                                  </code>
                                ),

                                a: ({
                                  href,
                                  children,
                                }) => (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="
                                      font-medium
                                      text-blue-600
                                      underline
                                      underline-offset-2
                                      dark:text-blue-400
                                    "
                                  >
                                    {children}
                                  </a>
                                ),
                              }}
                            >
                              {message.text}
                            </ReactMarkdown>
                          )}

                        </div>
                      </motion.div>
                    );
                  }
                )}


                {/* ==================================================
                    SUGGESTIONS
                ================================================== */}

                {messages.length === 1 && (
                  <div className="pt-2">

                    <p
                      className="
                        mb-3
                        text-xs
                        font-medium
                        text-zinc-500
                        dark:text-zinc-400
                      "
                    >
                      Try asking
                    </p>


                    <div
                      className="
                        grid grid-cols-1
                        gap-2
                      "
                    >
                      {SUGGESTIONS.map(
                        (suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            disabled={sending}
                            onClick={() =>
                              sendMessage(
                                suggestion
                              )
                            }
                            className="
                              rounded-xl
                              border
                              border-zinc-200
                              bg-white
                              px-3 py-2.5
                              text-left
                              text-xs
                              font-medium
                              text-zinc-700
                              transition

                              hover:border-blue-300
                              hover:bg-blue-50
                              hover:text-blue-700

                              disabled:opacity-50

                              dark:border-zinc-800
                              dark:bg-zinc-900
                              dark:text-zinc-300

                              dark:hover:border-blue-800
                              dark:hover:bg-blue-950/30
                              dark:hover:text-blue-300
                            "
                          >
                            {suggestion}
                          </button>
                        )
                      )}
                    </div>

                  </div>
                )}


                {/* ==================================================
                    THINKING
                ================================================== */}

                {sending && !streamStarted && (
                  <div className="flex justify-start">

                    <div
                      className="
                        mr-2 mt-1
                        flex h-7 w-7
                        items-center
                        justify-center
                        rounded-lg
                        bg-blue-100
                        text-blue-600
                        dark:bg-blue-950
                        dark:text-blue-400
                      "
                    >
                      <Bot size={15} />
                    </div>


                    <div
                      className="
                        flex items-center
                        gap-2
                        rounded-2xl
                        rounded-bl-md
                        border
                        border-zinc-200
                        bg-white
                        px-4 py-3
                        text-sm
                        text-zinc-500
                        shadow-sm
                        dark:border-zinc-800
                        dark:bg-zinc-900
                        dark:text-zinc-400
                      "
                    >
                      <LoaderCircle
                        size={16}
                        className="animate-spin"
                      />

                      Thinking...
                    </div>

                  </div>
                )}


                {/* ==================================================
                    ERROR
                ================================================== */}

                {error && (
                  <div
                    className="
                      rounded-xl
                      border
                      border-red-200
                      bg-red-50
                      px-3 py-2
                      text-xs
                      text-red-700

                      dark:border-red-900/50
                      dark:bg-red-950/30
                      dark:text-red-300
                    "
                  >
                    {error}
                  </div>
                )}


                <div ref={bottomRef} />

              </div>
            </div>


            {/* ==================================================
                MESSAGE INPUT
            ================================================== */}

            <footer
              className="
                border-t
                border-zinc-200
                bg-white
                p-3
                dark:border-zinc-800
                dark:bg-zinc-950
              "
            >

              <form
                onSubmit={handleSubmit}
                className="
                  flex items-end
                  gap-2
                  rounded-2xl
                  border
                  border-zinc-200
                  bg-zinc-50
                  p-2
                  transition

                  focus-within:border-blue-400
                  focus-within:ring-4
                  focus-within:ring-blue-500/10

                  dark:border-zinc-800
                  dark:bg-zinc-900
                "
              >

                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) =>
                    setInput(
                      event.target.value
                    )
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
                  placeholder="Ask GCT Assistant..."
                  className="
                    max-h-28
                    min-h-10
                    flex-1
                    resize-none
                    bg-transparent
                    px-2 py-2
                    text-sm
                    text-zinc-900
                    outline-none
                    placeholder:text-zinc-400
                    dark:text-white
                  "
                />


                <button
                  type="submit"
                  disabled={
                    !input.trim() ||
                    sending
                  }
                  className="
                    flex h-10 w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-blue-600
                    text-white
                    transition

                    hover:bg-blue-700

                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                  aria-label="Send message"
                >
                  {sending ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Send size={17} />
                  )}
                </button>

              </form>


              <p
                className="
                  mt-2 px-1
                  text-center
                  text-[10px]
                  text-zinc-400
                "
              >
                AI can make mistakes. Verify important
                academic or university information.
              </p>

            </footer>

          </motion.section>
        )}
      </AnimatePresence>


      {/* ========================================================
          FLOATING CHAT BUTTON
      ======================================================== */}

      <motion.button
        type="button"
        onClick={() =>
          setIsOpen(
            (current) => !current
          )
        }
        whileHover={{
          scale: 1.05,
        }}
        whileTap={{
          scale: 0.95,
        }}
        className="
          fixed bottom-6
          right-6
          z-[101]

          flex h-14 w-14
          items-center
          justify-center

          rounded-2xl
          bg-blue-600
          text-white

          shadow-lg
          shadow-blue-600/25

          transition
          hover:bg-blue-700

          max-sm:bottom-4
          max-sm:right-4
        "
        aria-label={
          isOpen
            ? "Close GCT Assistant"
            : "Open GCT Assistant"
        }
      >

        <AnimatePresence mode="wait">

          {isOpen ? (
            <motion.div
              key="close"
              initial={{
                opacity: 0,
                rotate: -90,
              }}
              animate={{
                opacity: 1,
                rotate: 0,
              }}
              exit={{
                opacity: 0,
                rotate: 90,
              }}
            >
              <X size={23} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{
                opacity: 0,
                scale: 0.8,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
              }}
            >
              <MessageCircle size={24} />
            </motion.div>
          )}

        </AnimatePresence>

      </motion.button>
    </>
  );
}