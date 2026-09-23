import { useEffect, useMemo, useState } from "react";
import { Hash, MessageCircle, Reply, Send, Trash2, Users } from "lucide-react";
import { api } from "../../api";

const REACTIONS = ["👍", "❤️", "😂", "🔥", "🎉", "👏"];

function initials(name = "Student") {
  return name.split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function timeLabel(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function CommunityPage({ student }) {
  const [community, setCommunity] = useState(null);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const activeChannel = useMemo(
    () => community?.channels?.find((channel) => channel.id === activeChannelId),
    [community, activeChannelId]
  );

  useEffect(() => {
    let alive = true;
    api.getMyCommunity()
      .then((data) => {
        if (!alive) return;
        setCommunity(data);
        setActiveChannelId(data.channels?.[0]?.id ?? null);
      })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!activeChannelId) return;
    setError("");
    setMessages([]);
    setReplyTo(null);
    api.getCommunityMessages(activeChannelId)
      .then(setMessages)
      .catch((err) => setError(err.message));
  }, [activeChannelId]);

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

  if (loading) {
    return <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">Loading your community…</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
          <Users size={17} />
          <span className="text-xs font-semibold uppercase tracking-[0.12em]">Programme Community</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
          {community?.programme_name || "Community"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Year {community?.year_level} · A space for classmates to study, chat and have fun.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

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
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                      {initials(message.author.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{message.author.name}</span>
                        <span className="text-[11px] text-zinc-400">Year {message.author.current_year} · {timeLabel(message.created_at)}</span>
                      </div>
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
    </div>
  );
}
