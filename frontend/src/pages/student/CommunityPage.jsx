import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Hash, MessageCircle, Reply, Send, Trash2, UserRound, Users, X } from "lucide-react";
import { api } from "../../api";
import PastPapersPanel from "./PastPapersPanel";

const REACTIONS = ["👍", "❤️", "😂", "🔥", "🎉", "👏"];

const REWARD_NAMES = {
  "title-rising-scholar": "Rising Scholar",
  "title-credit-hunter": "Credit Hunter",
  "title-study-strategist": "Study Strategist",
  "title-campus-scholar": "Campus Scholar",
  "title-graduation-master": "Graduation Master",
  "title-module-master": "Module Master",
  "title-prerequisite-pro": "Prerequisite Pro",
  "title-credit-commander": "Credit Commander",
  "title-knowledge-sharer": "Knowledge Sharer",
  "title-fort-hare-legend": "Fort Hare Legend",
  "title-study-streak": "Study Streak",
  "title-goal-getter": "Goal Getter",
  "title-campus-mentor": "Campus Mentor",
  "title-academic-vanguard": "Academic Vanguard",
  "title-lions-pride": "Lion's Pride",
};
const THEME_CLASSES = {
  "theme-ocean": "from-cyan-50 via-white to-blue-50 dark:from-cyan-950/30 dark:via-zinc-900 dark:to-blue-950/30",
  "theme-violet": "from-violet-50 via-white to-fuchsia-50 dark:from-violet-950/30 dark:via-zinc-900 dark:to-fuchsia-950/30",
  "theme-gold": "from-amber-50 via-white to-yellow-50 dark:from-amber-950/30 dark:via-zinc-900 dark:to-yellow-950/20",
  "theme-emerald": "from-emerald-50 via-white to-teal-50 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-teal-950/30",
  "theme-midnight": "from-slate-100 via-zinc-50 to-indigo-100 dark:from-slate-950 dark:via-zinc-900 dark:to-indigo-950/50",
  "theme-sunset": "from-orange-50 via-rose-50 to-amber-50 dark:from-orange-950/30 dark:via-zinc-900 dark:to-rose-950/30",
  "theme-royal": "from-purple-50 via-white to-indigo-50 dark:from-purple-950/40 dark:via-zinc-900 dark:to-indigo-950/40",
  "theme-legend": "from-amber-100 via-zinc-50 to-yellow-100 dark:from-zinc-950 dark:via-amber-950/30 dark:to-zinc-950",
  "theme-sky": "from-sky-50 via-white to-cyan-50 dark:from-sky-950/30 dark:via-zinc-900 dark:to-cyan-950/30",
  "theme-forest": "from-green-50 via-white to-emerald-100 dark:from-green-950/40 dark:via-zinc-900 dark:to-emerald-950/30",
  "theme-rose": "from-rose-50 via-white to-pink-50 dark:from-rose-950/30 dark:via-zinc-900 dark:to-pink-950/30",
  "theme-cosmic": "from-indigo-100 via-violet-50 to-fuchsia-100 dark:from-indigo-950/60 dark:via-zinc-950 dark:to-fuchsia-950/50",
  "theme-lion": "from-blue-100 via-white to-amber-100 dark:from-blue-950/50 dark:via-zinc-950 dark:to-amber-950/40",
};
const FRAME_CLASSES = {
  "frame-scholar": "ring-2 ring-brand-400/60 ring-offset-2 dark:ring-offset-zinc-900",
  "frame-legend": "ring-4 ring-amber-400/70 ring-offset-2 shadow-[0_0_28px_rgba(245,158,11,0.35)] animate-pulse dark:ring-offset-zinc-900",
  "frame-focus": "ring-2 ring-emerald-400/70 ring-offset-2 dark:ring-offset-zinc-900",
  "frame-campus": "ring-2 ring-blue-400/70 ring-offset-2 shadow-md dark:ring-offset-zinc-900",
  "frame-honours": "ring-[3px] ring-violet-400/70 ring-offset-2 shadow-lg dark:ring-offset-zinc-900",
  "frame-lion": "ring-4 ring-yellow-500/70 ring-offset-2 shadow-[0_0_20px_rgba(234,179,8,0.3)] dark:ring-offset-zinc-900",
  "frame-master": "ring-4 ring-fuchsia-400/70 ring-offset-2 shadow-[0_0_30px_rgba(217,70,239,0.35)] animate-pulse dark:ring-offset-zinc-900",
  "frame-spark": "ring-2 ring-cyan-400/70 ring-offset-2 shadow-sm dark:ring-offset-zinc-900",
  "frame-book": "ring-2 ring-emerald-500/70 ring-offset-2 shadow-md dark:ring-offset-zinc-900",
  "frame-diamond": "ring-[3px] ring-sky-300/80 ring-offset-2 shadow-[0_0_18px_rgba(125,211,252,0.4)] dark:ring-offset-zinc-900",
  "frame-cosmic": "ring-4 ring-indigo-400/70 ring-offset-2 shadow-[0_0_28px_rgba(99,102,241,0.4)] dark:ring-offset-zinc-900",
  "frame-ultimate": "ring-4 ring-yellow-300/80 ring-offset-2 shadow-[0_0_34px_rgba(250,204,21,0.5)] animate-pulse dark:ring-offset-zinc-900",
};
function achievementLabel(id = "") {
  return id.split("-").join(" ").split("_").join(" ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function initials(name = "Student") {
  return name.split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function timeLabel(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function CommunityPage({ student }) {
  const [community, setCommunity] = useState(null);
  const [scope, setScope] = useState("year");
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [privateDraft, setPrivateDraft] = useState("");
  const messagesEndRef = useRef(null);

  const activeChannel = useMemo(
    () => community?.channels?.find((channel) => channel.id === activeChannelId),
    [community, activeChannelId]
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    setCommunity(null);
    setActiveChannelId(null);
    setMessages([]);
    setReplyTo(null);

    const communityRequest =
      scope === "all" ? api.getProgrammeCommunity() : api.getMyCommunity();

    communityRequest
      .then((data) => {
        if (!alive) return;
        setCommunity(data);
        setActiveChannelId(data.channels?.[0]?.id ?? null);
      })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));

    return () => { alive = false; };
  }, [scope]);

  useEffect(() => {
    if (!activeChannelId) return;

    let alive = true;
    let firstLoad = true;

    const loadMessages = async () => {
      try {
        const data = await api.getCommunityMessages(activeChannelId);
        if (!alive) return;
        setMessages(data);
        if (firstLoad) {
          setError("");
          firstLoad = false;
        }
      } catch (err) {
        if (alive) setError(err.message);
      }
    };

    setError("");
    setMessages([]);
    setReplyTo(null);
    loadMessages();

    // Lightweight polling keeps classmates' messages and reactions fresh
    // without requiring a persistent WebSocket connection.
    const intervalId = window.setInterval(loadMessages, 5000);

    return () => {
      alive = false;
      window.clearInterval(intervalId);
    };
  }, [activeChannelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  async function sendMessage(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !activeChannelId || sending) return;
    setSending(true);
    setError("");
    try {
      const message = await api.sendCommunityMessage(activeChannelId, {
        content,
        parent_message_id: replyTo?.id ?? null,
      });
      setMessages((current) => [...current, message]);
      setDraft("");
      setReplyTo(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function react(messageId, emoji) {
    try {
      const updated = await api.toggleCommunityReaction(messageId, emoji);
      setMessages((current) => current.map((m) => m.id === messageId ? updated : m));
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeMessage(messageId) {
    try {
      await api.deleteCommunityMessage(messageId);
      setMessages((current) => current.map((m) =>
        m.id === messageId ? { ...m, content: null, is_deleted: true } : m
      ));
    } catch (err) {
      setError(err.message);
    }
  }

  async function refreshPrivateArea() {
    try {
      const [requestData, conversationData] = await Promise.all([
        api.getPrivateChatRequests(),
        api.getPrivateConversations(),
      ]);
      setRequests(requestData);
      setConversations(conversationData);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { refreshPrivateArea(); }, []);


  async function openProfile(studentId) {
    if (studentId === student?.id) return;
    setProfileLoading(true);
    setError("");
    try {
      setProfile(await api.getCommunityStudentProfile(studentId));
    } catch (err) {
      setError(err.message);
    } finally {
      setProfileLoading(false);
    }
  }

  async function requestChat() {
    try {
      await api.requestPrivateChat(profile.id);
      setProfile((current) => ({ ...current, chat_status: "outgoing_pending" }));
      await refreshPrivateArea();
    } catch (err) { setError(err.message); }
  }

  async function respondToRequest(requestId, accept) {
    try {
      const conversation = accept
        ? await api.acceptPrivateChatRequest(requestId)
        : await api.declinePrivateChatRequest(requestId);
      await refreshPrivateArea();
      if (accept) await openConversation(conversation);
    } catch (err) { setError(err.message); }
  }

  async function openConversation(conversation) {
    setActiveConversation(conversation);
    setProfile(null);
    try {
      setPrivateMessages(await api.getPrivateMessages(conversation.id));
    } catch (err) { setError(err.message); }
  }

  useEffect(() => {
    let target = null;
    try {
      const raw = sessionStorage.getItem("community-notification-target");
      if (raw) {
        target = JSON.parse(raw);
        sessionStorage.removeItem("community-notification-target");
      }
    } catch {
      target = null;
    }
    if (!target) return;

    const openTarget = async () => {
      try {
        if (target.kind === "private_message" && target.conversation_id) {
          const conversationData = await api.getPrivateConversations();
          setConversations(conversationData);
          const conversation = conversationData.find((item) => item.id === target.conversation_id);
          if (conversation) await openConversation(conversation);
        } else if (target.kind === "chat_request") {
          await refreshPrivateArea();
          document.getElementById("community-chat-requests")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } catch (err) {
        setError(err.message);
      }
    };
    openTarget();
  }, []);


  async function sendPrivate(event) {
    event.preventDefault();
    const content = privateDraft.trim();
    if (!content || !activeConversation) return;
    try {
      const message = await api.sendPrivateMessage(activeConversation.id, content);
      setPrivateMessages((items) => [...items, message]);
      setPrivateDraft("");
    } catch (err) { setError(err.message); }
  }

  if (loading) {
    return <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">Loading your community…</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
          <Users size={17} />
          <span className="text-xs font-semibold uppercase tracking-[0.12em]">Programme Community</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
          {community?.programme_name || "Community"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {scope === "all"
            ? "All years · Connect with every registered student in your programme."
            : `Year ${community?.year_level} · A space for classmates to study, chat and have fun.`}
        </p>
        </div>

        <div className="inline-flex self-start rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setScope("year")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              scope === "year"
                ? "bg-white text-brand-700 shadow-sm dark:bg-zinc-800 dark:text-brand-300"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            My Year
          </button>
          <button
            type="button"
            onClick={() => setScope("all")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              scope === "all"
                ? "bg-white text-brand-700 shadow-sm dark:bg-zinc-800 dark:text-brand-300"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            All Years
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <PastPapersPanel student={student} />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2"><UserRound size={16} /><h2 className="font-semibold text-zinc-900 dark:text-white">Chat requests</h2></div>
          <div className="mt-3 space-y-2">
            {requests.filter((r) => r.receiver.id === student?.id && r.status === "pending").length === 0 && <p className="text-xs text-zinc-500">No pending requests.</p>}
            {requests.filter((r) => r.receiver.id === student?.id && r.status === "pending").map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
                <button onClick={() => openProfile(r.sender.id)} className="text-left text-sm font-semibold text-zinc-800 hover:text-brand-600 dark:text-zinc-200">{r.sender.name}<span className="block text-xs font-normal text-zinc-500">Year {r.sender.current_year}</span></button>
                <div className="flex gap-1">
                  <button onClick={() => respondToRequest(r.id, true)} className="rounded-lg bg-emerald-500 p-2 text-white" title="Accept"><Check size={15}/></button>
                  <button onClick={() => respondToRequest(r.id, false)} className="rounded-lg bg-zinc-200 p-2 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200" title="Decline"><X size={15}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2"><MessageCircle size={16} /><h2 className="font-semibold text-zinc-900 dark:text-white">Private conversations</h2></div>
          <div className="mt-3 flex flex-wrap gap-2">
            {conversations.length === 0 && <p className="text-xs text-zinc-500">Accepted conversations will appear here.</p>}
            {conversations.map((conversation) => (
              <button key={conversation.id} onClick={() => openConversation(conversation)} className="rounded-xl border border-zinc-200 px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:border-brand-300 hover:bg-brand-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-brand-500/10">
                {conversation.other_student.name}<span className="block text-[11px] font-normal text-zinc-400">Year {conversation.other_student.current_year}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid min-h-[650px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm md:grid-cols-[220px_1fr] dark:border-zinc-800 dark:bg-zinc-900">
        <aside className="border-b border-zinc-200 bg-zinc-50/70 p-3 md:border-b-0 md:border-r dark:border-zinc-800 dark:bg-zinc-950/50">
          <p className="px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Channels</p>
          <div className="flex gap-2 overflow-x-auto md:block md:space-y-1">
            {community?.channels?.map((channel) => (
              <button
                key={channel.id}
                type="button"
                onClick={() => setActiveChannelId(channel.id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition md:w-full ${
                  activeChannelId === channel.id
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <Hash size={16} />
                {channel.name}
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Hash size={18} className="text-zinc-400" />
              <h2 className="font-semibold text-zinc-950 dark:text-white">{activeChannel?.name || "Channel"}</h2>
            </div>
            <p className="mt-1 text-xs text-zinc-500">{activeChannel?.description}</p>
          </header>

          <div className="flex-1 space-y-1 overflow-y-auto p-3 sm:p-5">
            {messages.length === 0 && (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                  <MessageCircle size={22} />
                </div>
                <p className="mt-4 font-semibold text-zinc-900 dark:text-white">Start the conversation</p>
                <p className="mt-1 max-w-sm text-sm text-zinc-500">Be the first person to say something in #{activeChannel?.slug || "general"}.</p>
              </div>
            )}

            {messages.map((message) => {
              const mine = message.author.id === student?.id;
              return (
                <article key={message.id} className="group rounded-xl px-3 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => openProfile(message.author.id)}
                      disabled={mine}
                      aria-label={mine ? "Your profile" : `View ${message.author.name}'s profile`}
                      className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-xs font-bold text-brand-700 transition hover:ring-2 hover:ring-brand-300 disabled:cursor-default disabled:hover:ring-0 dark:bg-brand-500/15 dark:text-brand-300"
                    >
                      {initials(message.author.name)}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <button
                          type="button"
                          onClick={() => openProfile(message.author.id)}
                          disabled={mine}
                          className="text-sm font-semibold text-zinc-900 hover:text-brand-600 disabled:cursor-default disabled:hover:text-zinc-900 dark:text-white dark:hover:text-brand-300 dark:disabled:hover:text-white"
                        >
                          {message.author.name}
                        </button>
                        {message.author.is_simulated && (
                          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                            Simulated
                          </span>
                        )}
                        <span className="text-[11px] text-zinc-400">Year {message.author.current_year} · {timeLabel(message.created_at)}</span>
                      </div>
                      {message.parent_message_id && (() => {
                        const parent = messages.find((item) => item.id === message.parent_message_id);
                        if (!parent) return null;
                        return (
                          <div className="mt-2 rounded-lg border-l-2 border-brand-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:border-brand-700 dark:bg-zinc-800/70 dark:text-zinc-400">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{parent.author.name}</span>
                            <span className="ml-1">{parent.is_deleted ? "Message deleted" : parent.content}</span>
                          </div>
                        );
                      })()}
                      {message.is_deleted ? (
                        <p className="mt-1 text-sm italic text-zinc-400">Message deleted</p>
                      ) : (
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-700 dark:text-zinc-300">{message.content}</p>
                      )}

                      {!message.is_deleted && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {message.reactions?.map((reaction) => (
                            <button
                              key={reaction.emoji}
                              type="button"
                              onClick={() => react(message.id, reaction.emoji)}
                              className={`rounded-full border px-2 py-1 text-xs ${
                                reaction.reacted_by_me
                                  ? "border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-500/10"
                                  : "border-zinc-200 dark:border-zinc-700"
                              }`}
                            >
                              {reaction.emoji} {reaction.count}
                            </button>
                          ))}
                          <div className="flex opacity-70 transition group-hover:opacity-100">
                            {REACTIONS.filter((emoji) => !message.reactions?.some((r) => r.emoji === emoji)).slice(0, 3).map((emoji) => (
                              <button key={emoji} type="button" onClick={() => react(message.id, emoji)} className="rounded-md px-1.5 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700">{emoji}</button>
                            ))}
                          </div>
                          <button type="button" onClick={() => setReplyTo(message)} className="ml-1 flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700">
                            <Reply size={13} /> Reply
                          </button>
                          {mine && (
                            <button type="button" onClick={() => removeMessage(message.id)} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10">
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-zinc-200 p-3 sm:p-4 dark:border-zinc-800">
            {replyTo && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:bg-zinc-800">
                <span className="truncate">Replying to <strong>{replyTo.author.name}</strong>: {replyTo.content}</span>
                <button type="button" onClick={() => setReplyTo(null)} className="ml-3 font-semibold">×</button>
              </div>
            )}
            <form onSubmit={sendMessage} className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
                maxLength={2000}
                rows={1}
                placeholder={`Message #${activeChannel?.slug || "general"}`}
                className="min-h-11 max-h-32 flex-1 resize-y rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                <Send size={17} />
              </button>
            </form>
            <p className="mt-2 text-[11px] text-zinc-400">Enter to send · Shift + Enter for a new line</p>
          </div>
        </section>
      </div>
      {profileLoading && !profile && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
          <div className="rounded-2xl bg-white px-5 py-4 text-sm font-medium text-zinc-700 shadow-xl dark:bg-zinc-900 dark:text-zinc-200">Loading student profile…</div>
        </div>
      )}

      {profile && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setProfile(null)}>
          <div className={`w-full max-w-md rounded-2xl border border-zinc-200 bg-gradient-to-br p-6 shadow-2xl dark:border-zinc-800 ${THEME_CLASSES[profile.equipped_theme] || "from-white via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950"}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex size-12 items-center justify-center rounded-2xl bg-brand-100 font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 ${FRAME_CLASSES[profile.equipped_frame] || ""}`}>{initials(profile.name)}</div>
                <div><h2 className="font-bold text-zinc-950 dark:text-white">{profile.name}</h2><p className="text-xs text-zinc-500">{profile.programme_code} · Year {profile.current_year}</p>{profile.equipped_title && <span className="mt-1 inline-flex rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:text-brand-300">✦ {REWARD_NAMES[profile.equipped_title] || achievementLabel(profile.equipped_title)}</span>}</div>
              </div>
              <button onClick={() => setProfile(null)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X size={18}/></button>
            </div>
            <div className="mt-5 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/70">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Programme</p>
              <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">{profile.programme_name}</p>
              {profile.contributor_achievement && <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">🏆 {profile.contributor_achievement} · {profile.past_paper_upload_count} papers shared</div>}
              {profile.achievement_showcase?.length > 0 && <div className="mt-4"><p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Achievement showcase</p><div className="mt-2 flex flex-wrap gap-2">{profile.achievement_showcase.map((id) => <span key={id} className="rounded-lg border border-zinc-200 bg-white/70 px-2.5 py-1.5 text-[10px] font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200">🏅 {achievementLabel(id)}</span>)}</div></div>}
              <p className="mt-3 text-xs text-zinc-500">Only basic community profile information, equipped cosmetics and contribution achievements are shared. Academic marks and contact details stay private.</p>
            </div>
            <div className="mt-5">
              {!profile.chat_status && <button onClick={requestChat} className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600">Request to chat privately</button>}
              {profile.chat_status === "outgoing_pending" && <div className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">Chat request pending</div>}
              {profile.chat_status === "incoming_pending" && <div className="rounded-xl bg-brand-50 px-4 py-3 text-center text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">This student has sent you a request. Accept it from Chat requests.</div>}
              {profile.chat_status === "accepted" && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">Private chat enabled</div>}
              {profile.chat_status === "declined" && <button onClick={requestChat} className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">Send a new chat request</button>}
            </div>
          </div>
        </div>
      )}

      {activeConversation && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setActiveConversation(null)}>
          <div className="flex h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
              <div><h2 className="font-bold text-zinc-950 dark:text-white">{activeConversation.other_student.name}</h2><p className="text-xs text-zinc-500">Private conversation · accepted connection</p></div>
              <button onClick={() => setActiveConversation(null)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X size={18}/></button>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {privateMessages.length === 0 && <p className="mt-10 text-center text-sm text-zinc-400">You are connected. Start your private conversation.</p>}
              {privateMessages.map((message) => {
                const mine = message.sender.id === student?.id;
                return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-brand-500 text-white" : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"}`}><p className="whitespace-pre-wrap break-words">{message.content}</p><p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-zinc-400"}`}>{timeLabel(message.created_at)}</p></div></div>;
              })}
            </div>
            <form onSubmit={sendPrivate} className="flex gap-2 border-t border-zinc-200 p-4 dark:border-zinc-800">
              <input value={privateDraft} onChange={(e) => setPrivateDraft(e.target.value)} maxLength={2000} placeholder="Write a private message…" className="h-11 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-brand-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"/>
              <button disabled={!privateDraft.trim()} className="flex size-11 items-center justify-center rounded-xl bg-brand-500 text-white disabled:opacity-40"><Send size={17}/></button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
