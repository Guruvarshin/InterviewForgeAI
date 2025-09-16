"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";

export default function CareerCoachFloat() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "greet-1",
      role: "assistant",
      content:
        "Hi, I’m Karier,your career coach. What role are you targeting, and what’s your biggest hurdle right now?",
    },
  ]);

  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, open]);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      const t = e.target;
      if (
        panelRef.current &&
        !panelRef.current.contains(t) &&
        btnRef.current &&
        !btnRef.current.contains(t)
      ) {
        setOpen(false);
      }
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || pending) return;

    setInput("");
    const userMsg = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setPending(true);

    try {
      const res = await fetch("/api/career-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-8).map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      const reply =
        res.ok && data.reply
          ? data.reply
          : data?.error || "Sorry, I had trouble replying. Please try again.";
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: "Network issue. Please try again." },
      ]);
    } finally {
      setPending(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* Floating action button */}
      {!open && (
        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 grid size-14 place-items-center rounded-full border bg-background shadow-lg transition hover:shadow-xl md:size-14"
          aria-label="Open career coach"
          title="Career Coach"
        >
          <Briefcase className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          ref={panelRef}
          className="fixed bottom-6 right-6 z-50 w-[min(92vw,380px)] overflow-hidden rounded-2xl border bg-background shadow-2xl"
          role="dialog"
          aria-label="Career Coach"
        >
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              <p className="text-sm font-semibold">Career Coach,Karier</p>
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-sm hover:bg-muted"
              onClick={() => setOpen(false)}
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>
          </div>

          <div className="max-h-[60vh] space-y-2 overflow-y-auto p-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-md border p-2 text-sm ${
                  m.role === "assistant" ? "bg-muted" : "bg-background"
                }`}
              >
                <p className="mb-0.5 font-medium">{m.role === "assistant" ? "Karier" : "You"}</p>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="flex items-center gap-2 border-t p-3">
            <textarea
              className="min-h-[44px] flex-1 rounded-md border bg-background p-2 text-sm"
              placeholder="Type your message… (Enter to send)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              disabled={pending}
            />
            <Button onClick={send} disabled={pending || !input.trim()}>
              {pending ? "Sending…" : "Send"}
            </Button>
          </div>

          <div className="border-t px-3 py-2 text-[11px] text-muted-foreground">
            General guidance only · No sign-in required
          </div>
        </div>
      )}
    </>
  );
}
