"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ClientRow = {
  id: number;
  phone: string;
  email: string;
  phone_verified: number;
  email_verified: number;
  created_at: string;
  updated_at: string;
};

type ChatMessage = {
  id: number;
  channel: string;
  direction: string;
  message_text: string;
  status: string;
  created_at: string;
};

type ThreadPayload = {
  client: {
    id: number;
    phone: string;
    email: string;
    phone_verified: number;
    email_verified: number;
    created_at: string;
    updated_at: string;
  };
  messages: ChatMessage[];
};

function channelLabel(ch: string) {
  if (ch === "email") return "Email";
  if (ch === "sms") return "SMS";
  return "Чат";
}

export default function AdminMessenger() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedParam = searchParams.get("c");
  const selectedId = selectedParam && /^\d+$/.test(selectedParam) ? Number(selectedParam) : null;

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [thread, setThread] = useState<ThreadPayload | null>(null);
  const [listQuery, setListQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [emailSubject, setEmailSubject] = useState("Обсуждение условий заказа");
  const [showExtraChannels, setShowExtraChannels] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadClients = useCallback(async () => {
    setError(null);
    setListLoading(true);
    try {
      const res = await fetch("/api/admin/clients", { credentials: "same-origin" });
      if (res.status === 401) {
        window.location.assign(`/admin/login?next=${encodeURIComponent("/admin")}`);
        return;
      }
      const text = await res.text();
      let data: { clients?: ClientRow[]; error?: string };
      try {
        data = JSON.parse(text) as { clients?: ClientRow[]; error?: string };
      } catch {
        setError(
          res.ok
            ? "Некорректный ответ сервера при загрузке клиентов."
            : `Сервер вернул ошибку (${res.status}). Проверьте, что сайт поднят (PM2), и обновите страницу.`
        );
        return;
      }
      if (!res.ok) {
        setError(data.error || "Не удалось загрузить клиентов");
        return;
      }
      setClients(data.clients || []);
    } catch {
      setError("Нет связи с сайтом (сеть, блокировка или HTTPS). Проверьте подключение и откройте консоль браузера (F12).");
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadThread = useCallback(async (id: number) => {
    setError(null);
    setThreadLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${id}`, { credentials: "same-origin" });
      if (res.status === 401) {
        window.location.assign(`/admin/login?next=${encodeURIComponent("/admin")}`);
        return;
      }
      const text = await res.text();
      let data: ThreadPayload & { error?: string };
      try {
        data = JSON.parse(text) as ThreadPayload & { error?: string };
      } catch {
        setError(`Сервер вернул не JSON (${res.status}). Обновите страницу.`);
        setThread(null);
        return;
      }
      if (!res.ok) {
        setError(data.error || "Не удалось загрузить чат");
        setThread(null);
        return;
      }
      setThread(data);
    } catch {
      setError("Нет связи с сайтом при загрузке чата.");
      setThread(null);
    } finally {
      setThreadLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  useEffect(() => {
    if (selectedId == null) {
      setThread(null);
      return;
    }
    void loadThread(selectedId);
  }, [selectedId, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages]);

  useEffect(() => {
    if (selectedId == null) return;
    const t = setInterval(() => void loadThread(selectedId), 12000);
    return () => clearInterval(t);
  }, [selectedId, loadThread]);

  useEffect(() => {
    const onFocus = () => {
      void loadClients();
      if (selectedId != null) void loadThread(selectedId);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [selectedId, loadClients, loadThread]);

  const selectClient = (id: number) => {
    router.push(`/admin?c=${id}`, { scroll: false });
  };

  const filteredClients = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) => c.email.toLowerCase().includes(q) || c.phone.includes(q) || String(c.id).includes(q)
    );
  }, [clients, listQuery]);

  const logout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  const exportCsv = () => {
    const header = ["ID", "Телефон", "Email", "Тел. ок", "Почта ок", "Обновлен"];
    const rows = filteredClients.map((row) => [
      row.id.toString(),
      `+${row.phone}`,
      row.email,
      row.phone_verified ? "Да" : "Нет",
      row.email_verified ? "Да" : "Нет",
      new Date(row.updated_at).toLocaleString("ru-RU")
    ]);
    const csv = [header, ...rows]
      .map((line) => line.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendChat = async () => {
    if (selectedId == null || !draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${selectedId}/message/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Не удалось сохранить сообщение");
        return;
      }
      setDraft("");
      await loadThread(selectedId);
      await loadClients();
    } catch {
      setError("Ошибка сети");
    } finally {
      setSending(false);
    }
  };

  const sendEmail = async () => {
    if (selectedId == null || !draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${selectedId}/message/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: emailSubject, text: draft })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Ошибка отправки email");
        return;
      }
      setDraft("");
      await loadThread(selectedId);
    } catch {
      setError("Ошибка сети");
    } finally {
      setSending(false);
    }
  };

  const sendSms = async () => {
    if (selectedId == null || !draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${selectedId}/message/sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Ошибка отправки SMS");
        return;
      }
      setDraft("");
      await loadThread(selectedId);
    } catch {
      setError("Ошибка сети");
    } finally {
      setSending(false);
    }
  };

  const sendBroadcastToAll = async () => {
    const text = broadcastText.trim();
    if (!text || clients.length === 0) return;
    if (
      !window.confirm(
        `Отправить это сообщение в чат всем ${clients.length} клиентам из базы? Они увидят его в личном кабинете (/account).`
      )
    ) {
      return;
    }
    setBroadcastSending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/broadcast/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const data = (await res.json()) as { error?: string; sent?: number };
      if (!res.ok) {
        setError(data.error || "Не удалось разослать");
        return;
      }
      setBroadcastText("");
      setBroadcastOpen(false);
      await loadClients();
      if (selectedId != null) await loadThread(selectedId);
    } catch {
      setError("Ошибка сети");
    } finally {
      setBroadcastSending(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-5rem)] flex-col px-2 pb-6 pt-20 sm:px-4">
      <div className="site-container mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden rounded-2xl border border-white/15 bg-black/20 shadow-xl backdrop-blur-md">
        <header className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
          <div>
            <h1 className="text-lg font-bold sm:text-xl">Клиенты</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadClients()}
              className="rounded-lg border border-white/25 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              Обновить
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-lg border border-white/25 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              CSV
            </button>
            <button
              type="button"
              onClick={() => setBroadcastOpen((v) => !v)}
              className="rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-3 py-1.5 text-sm hover:bg-indigo-500/25"
            >
              {broadcastOpen ? "Скрыть рассылку" : "Написать всем"}
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-white/25 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              Выйти
            </button>
          </div>
        </header>

        {broadcastOpen && (
          <div className="border-b border-white/10 bg-black/25 px-4 py-4">
            <p className="text-sm font-medium">Сообщение всем в чат</p>
            <p className="mt-1 text-xs opacity-70">
              Уходит в переписку каждого контакта из таблицы (всего в базе: {listLoading ? "…" : clients.length}).
              Клиенты видят текст в личном кабинете. Письма на почту при этом не отправляются автоматически.
            </p>
            <textarea
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              rows={3}
              placeholder="Текст для всех клиентов…"
              className="mt-3 w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <button
              type="button"
              disabled={broadcastSending || !broadcastText.trim() || clients.length === 0}
              onClick={() => void sendBroadcastToAll()}
              className="mt-2 rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {broadcastSending ? "Отправляем…" : "Разослать всем"}
            </button>
          </div>
        )}

        {error && <p className="flex-shrink-0 px-4 py-2 text-sm text-red-400">{error}</p>}

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <aside className="flex max-h-48 w-full flex-shrink-0 flex-col border-b border-white/10 md:max-h-none md:w-[min(100%,20rem)] md:border-b-0 md:border-r">
            <input
              value={listQuery}
              onChange={(e) => setListQuery(e.target.value)}
              placeholder="Поиск: email, телефон, id"
              className="mx-2 mt-2 rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <div className="mt-2 flex-1 overflow-y-auto px-1 pb-2">
              {listLoading && <p className="px-3 py-2 text-sm opacity-60">Загрузка...</p>}
              {!listLoading &&
                filteredClients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectClient(c.id)}
                    className={`mb-1 flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-white/10 ${
                      selectedId === c.id ? "bg-white/15 ring-1 ring-indigo-400/50" : ""
                    }`}
                  >
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-sm font-semibold text-white">
                      {(c.email[0] || "?").toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">+{c.phone}</span>
                      <span className="block truncate text-xs opacity-70">{c.email}</span>
                    </span>
                  </button>
                ))}
            </div>
          </aside>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-black/10">
            {selectedId == null && (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-sm opacity-70">
                Выберите клиента слева, чтобы открыть переписку
              </div>
            )}

            {selectedId != null && threadLoading && (
              <div className="flex flex-1 items-center justify-center text-sm opacity-70">Загрузка чата...</div>
            )}

            {selectedId != null && !threadLoading && thread && (
              <>
                <div className="flex-shrink-0 border-b border-white/10 px-4 py-3">
                  <p className="font-semibold">
                    +{thread.client.phone}{" "}
                    <span className="font-normal opacity-70">· {thread.client.email}</span>
                  </p>
                  <p className="mt-0.5 text-xs opacity-60">
                    Личный кабинет: тел. {thread.client.phone_verified ? "да" : "нет"}, почта{" "}
                    {thread.client.email_verified ? "да" : "нет"} · клиент видит чат на /account
                  </p>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-4">
                  {thread.messages.length === 0 && (
                    <p className="text-center text-sm opacity-50">Пока нет сообщений</p>
                  )}
                  {thread.messages.map((m) => {
                    const inbound = m.direction === "inbound";
                    return (
                      <div
                        key={m.id}
                        className={`flex ${inbound ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[min(100%,28rem)] rounded-2xl px-3 py-2 text-sm ${
                            inbound
                              ? "rounded-tl-sm border border-white/15 bg-white/10"
                              : "rounded-tr-sm bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white"
                          }`}
                        >
                          <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">
                            {inbound ? "Клиент" : "Вы"} · {channelLabel(m.channel)}
                            {m.channel !== "chat" && m.status ? ` · ${m.status}` : ""}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap">{m.message_text}</p>
                          <p className="mt-1 text-[10px] opacity-60">
                            {new Date(m.created_at).toLocaleString("ru-RU")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                <div className="flex-shrink-0 border-t border-white/10 p-3">
                  <div className="flex gap-2">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={2}
                      placeholder="Сообщение в чат…"
                      className="min-h-[48px] flex-1 resize-none rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-400"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void sendChat();
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={sending || !draft.trim()}
                      onClick={() => void sendChat()}
                      className="self-end rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Отправить
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] opacity-55">
                    Сообщение попадает в личный кабинет клиента (/account). При настроенном SMTP ему также уходит письмо со ссылкой.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowExtraChannels((v) => !v)}
                    className="mt-2 text-xs text-indigo-300 underline opacity-90 hover:opacity-100"
                  >
                    {showExtraChannels ? "Скрыть Email и SMS" : "Отправить ещё через Email или SMS"}
                  </button>
                  {showExtraChannels && (
                    <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                      <input
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Тема письма"
                        className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-400"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={sending || !draft.trim()}
                          onClick={() => void sendEmail()}
                          className="rounded-lg border border-white/30 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
                        >
                          Email
                        </button>
                        <button
                          type="button"
                          disabled={sending || !draft.trim()}
                          onClick={() => void sendSms()}
                          className="rounded-lg border border-white/30 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
                        >
                          SMS
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
