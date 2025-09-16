"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ReviewPanel({ sessionId }) {
  const [data, setData] = useState({ scores: null, feedback: null });
  const [isPending, startTransition] = useTransition();

  async function load() {
    try {
      const res = await fetch(`/api/session/${sessionId}/review`, { cache: "no-store" });
      const json = await res.json();
      if (res.ok) setData({ scores: json.scores, feedback: json.feedback });
    } catch {}
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  function runReview() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}/review`, { method: "POST" });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json?.error || "Review failed");
          return;
        }
        toast.success("Review generated");
        setData({ scores: json.scores, feedback: json.feedback });
      } catch (e) {
        console.error(e);
        toast.error("Network error");
      }
    });
  }

  async function exportPdf() {
    try {
      const res = await fetch(`/api/session/${sessionId}/export`, { method: "GET" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j?.error || "Export failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Interview_Review_${sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error("Export error");
    }
  }

  const scores = data?.scores;
  const feedback = data?.feedback;

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">Interview Review</p>
        <div className="flex items-center gap-2">
          <Button onClick={runReview} disabled={isPending}>
            {isPending ? "Evaluating…" : "End & Review"}
          </Button>
          <Button variant="secondary" onClick={exportPdf} disabled={!scores}>
            Export PDF
          </Button>
        </div>
      </div>

      {!scores && (
        <p className="text-sm text-muted-foreground">
          Click <em>End & Review</em> to generate scores and feedback.
        </p>
      )}

      {scores && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border p-2 text-sm">
            <p className="font-medium">Overall: {scores.overall?.toFixed?.(1) ?? scores.overall}/10</p>
            <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
              {Object.entries(scores.categories || {}).map(([k, v]) => (
                <p key={k}>{k.replace(/_/g, " ")}: {v}/10</p>
              ))}
            </div>
          </div>

          <div className="rounded-md border p-2 text-sm">
            <p className="font-medium">Recommendation: {feedback?.hire_recommendation}</p>
            <p className="mt-2 whitespace-pre-wrap">{feedback?.summary}</p>
          </div>

          <div className="rounded-md border p-2 text-sm">
            <p className="font-medium">Strengths</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {(feedback?.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>

          <div className="rounded-md border p-2 text-sm">
            <p className="font-medium">Areas for improvement</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {(feedback?.areas_for_improvement || []).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>

          <div className="md:col-span-2 rounded-md border p-2 text-sm">
            <p className="font-medium">Recommendations</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {(feedback?.recommendations || []).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
