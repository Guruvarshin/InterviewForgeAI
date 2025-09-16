"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const hasSpeechRecognition = () => {
  const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  return !!SR;
};

const hasSpeechSynthesis = () => typeof window !== "undefined" && "speechSynthesis" in window;

export default function ChatClient({ sessionId, initialMessages = [], initialNotes = "" }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  // TTS
  const [ttsEnabled, setTtsEnabled] = useState(false);

  // STT state
  const [recognizing, setRecognizing] = useState(false);
  const recRef = useRef(null);            // SpeechRecognition instance
  const mediaRecRef = useRef(null);       // MediaRecorder for fallback
  const chunksRef = useRef([]);

  // Notes state (with auto-save)
  const [notes, setNotes] = useState(initialNotes || "");
  const [notesSaving, setNotesSaving] = useState(false);
  const notesTimer = useRef(null);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // --- NOTES: debounced PATCH to /api/session/[id]/notes ---
  useEffect(() => {
    return () => {
      if (notesTimer.current) clearTimeout(notesTimer.current);
    };
  }, []);

  function queueSaveNotes(next) {
    setNotes(next);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(async () => {
      setNotesSaving(true);
      try {
        const res = await fetch(`/api/session/${sessionId}/notes`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: next }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          toast.error(j?.error || "Failed to save notes");
        }
      } catch {
        toast.error("Network error while saving notes");
      } finally {
        setNotesSaving(false);
      }
    }, 600);
  }

  // --- TTS ---
  function speak(text) {
    if (!ttsEnabled || !hasSpeechSynthesis() || !text) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1;
      u.pitch = 1;
      window.speechSynthesis.cancel(); // stop any current speech
      window.speechSynthesis.speak(u);
    } catch {
      /* noop */
    }
  }

  // --- Send to AI ---
  async function send() {
    const text = input.trim();
    if (!text) return;

    setInput("");
    const userMsg = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((m) => [...m, userMsg]);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data?.error || "Chat failed");
          return;
        }
        const aiText = data.reply || "…";
        const aiMsg = { id: crypto.randomUUID(), role: "assistant", content: aiText };
        setMessages((m) => [...m, aiMsg]);
        speak(aiText);
      } catch (e) {
        console.error(e);
        toast.error("Network error");
      }
    });
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isPending) send();
    }
  }

  // --- STT: Path A, Web Speech API live dictation (final results only) ---
  async function startBrowserSTT() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    recRef.current = rec;

    rec.continuous = false;       // one-shot
    rec.interimResults = true;    // we collect, but we only commit on final
    rec.lang = "en-US";

    let finalCollected = "";

    rec.onstart = () => setRecognizing(true);
    rec.onerror = (e) => {
      console.warn("SR error", e);
      toast.error("Voice recognition error");
      setRecognizing(false);
    };
    rec.onend = () => {
      setRecognizing(false);
      // Commit only the final text (no noisy interims)
      if (finalCollected.trim()) {
        setInput((prev) => {
          const base = prev.trim().length ? prev + " " : "";
          return (base + finalCollected.trim()).trim();
        });
      }
    };
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript || "";
        if (e.results[i].isFinal) {
          finalCollected += (finalCollected ? " " : "") + t.trim();
        }
      }
    };

    rec.start();
  }

  function stopBrowserSTT() {
    try {
      recRef.current?.stop();
    } catch {}
    setRecognizing(false);
  }

  // --- STT: Path B, MediaRecorder + /api/stt (Groq Whisper), final only ---
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mediaRecRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const fd = new FormData();
        fd.append("audio", new File([blob], "speech.webm", { type: "audio/webm" }));

        try {
          const res = await fetch("/api/stt", { method: "POST", body: fd });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            toast.error(data?.error || "Transcription failed");
            return;
          }
          // final transcript only
          const finalText = String(data.text || "").trim();
          if (finalText) {
            setInput((prev) => {
              const base = prev.trim().length ? prev + " " : "";
              return (base + finalText).trim();
            });
          }
        } catch (e) {
          console.error(e);
          toast.error("Transcription network error");
        }

        stream.getTracks().forEach((t) => t.stop());
        setRecognizing(false);
      };

      mr.start();
      setRecognizing(true);
    } catch (e) {
      console.error(e);
      toast.error("Mic permission denied");
      setRecognizing(false);
    }
  }

  function stopRecording() {
    try {
      mediaRecRef.current?.stop();
    } catch {}
  }

  // Unified voice toggle
  function toggleVoice() {
    if (recognizing) {
      if (hasSpeechRecognition()) stopBrowserSTT();
      else stopRecording();
    } else {
      if (hasSpeechRecognition()) startBrowserSTT();
      else startRecording();
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Chat column */}
      <div className="md:col-span-2 rounded-lg border p-3">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-md border p-2 text-sm ${m.role === "user" ? "bg-background" : "bg-muted"}`}
            >
              <p className="font-medium">{m.role === "user" ? "You" : "AI"}</p>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <textarea
            className="flex-1 rounded-md border bg-background p-2 text-sm"
            placeholder="Speak or type your answer… (Shift+Enter for newline)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            disabled={isPending}
          />
          <Button onClick={send} disabled={isPending || !input.trim()}>
            {isPending ? "Sending…" : "Send"}
          </Button>
          <Button
            type="button"
            variant={recognizing ? "destructive" : "outline"}
            onClick={toggleVoice}
            title={hasSpeechRecognition() ? "Voice dictation (browser)" : "Record & transcribe (Groq Whisper)"}
          >
            {recognizing ? "Stop" : "🎙 Voice"}
          </Button>

          <label className="ml-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={ttsEnabled}
              onChange={(e) => setTtsEnabled(e.target.checked)}
            />
            Speak replies
          </label>
        </div>
      </div>

      {/* Notes column (saves automatically) */}
      <div className="rounded-lg border p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Notes</p>
          <span className="text-xs text-muted-foreground">
            {notesSaving ? "Saving…" : "Saved"}
          </span>
        </div>
        <textarea
          className="h-60 w-full rounded-md border bg-background p-2 text-sm"
          placeholder="Jot notes here…"
          value={notes}
          onChange={(e) => queueSaveNotes(e.target.value)}
        />
        <div className="mt-3 text-xs text-muted-foreground">
          {hasSpeechRecognition()
            ? "Voice input uses your browser’s speech recognition."
            : "Voice input records and transcribes with Groq Whisper."}
        </div>
      </div>
    </div>
  );
}
