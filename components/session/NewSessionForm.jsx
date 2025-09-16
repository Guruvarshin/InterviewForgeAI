"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function NewSessionForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;

    const fd = new FormData(e.currentTarget);

    const role = String(fd.get("role") || "").trim();
    const company = String(fd.get("company") || "").trim();
    const jdText = String(fd.get("jdText") || "").trim();

    if (!role) return toast.error("Job Title is required");
    if (!company) return toast.error("Company is required");
    if (jdText.length < 30) return toast.error("JD must be at least 30 characters");

    setBusy(true);
    try {
      const res = await fetch("/api/session", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || "Failed to create session");
        return;
      }
      toast.success("Session created");
      router.push(`/session/${data.id}`);
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  }

  function onReset(e) {
    e.preventDefault();
    (e.currentTarget.form || document.querySelector("form"))?.reset();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Paste a job description, (optionally) add your resume PDF, choose a mode, and start the interview.
      </p>

      <div className="rounded-2xl border p-5 md:p-6">
        <h2 className="text-lg font-semibold">Job details</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {/* Job Title */}
          <div className="md:col-span-1">
            <label htmlFor="role" className="mb-1 block text-sm font-medium">
              Job Title<span className="text-rose-600">*</span>
            </label>
            <input
              id="role"
              name="role"
              type="text"
              required
              placeholder="e.g., Frontend Engineer"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              The interview will target this role specifically.
            </p>
          </div>

          {/* Company */}
          <div className="md:col-span-1">
            <label htmlFor="company" className="mb-1 block text-sm font-medium">
              Company<span className="text-rose-600">*</span>
            </label>
            <input
              id="company"
              name="company"
              type="text"
              required
              placeholder="e.g., Zoho"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              We’ll use this to personalize the interviewer.
            </p>
          </div>
        </div>

        {/* Mode */}
        <div className="mt-4 grid gap-2 md:max-w-sm">
          <label htmlFor="mode" className="text-sm font-medium">
            Interview Mode (optional)
          </label>
          <select
            id="mode"
            name="mode"
            defaultValue=""
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Ask me at start</option>
            <option value="technical">Technical</option>
            <option value="general">General</option>
            <option value="combo">Combination</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Leave blank to let the AI ask which mode you prefer at the beginning.
          </p>
        </div>

        {/* JD */}
        <div className="mt-4 grid gap-2">
          <label htmlFor="jdText" className="text-sm font-medium">
            Job Description<span className="text-rose-600">*</span>
          </label>
          <textarea
            id="jdText"
            name="jdText"
            minLength={30}
            required
            rows={6}
            placeholder="Paste the job description here…"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Min 30 characters. Paste as-is from the job post.
          </p>
        </div>

        {/* Resume */}
        <div className="mt-4 grid gap-2">
          <label htmlFor="resume" className="text-sm font-medium">
            Resume (PDF, optional)
          </label>
          <input
            id="resume"
            name="resume"
            type="file"
            accept="application/pdf"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-2"
          />
          <div className="text-xs text-muted-foreground">
            Max 5MB. We’ll parse it for tailored questions.
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Starting…" : "Start Interview"}
          </Button>
          <Button type="button" variant="outline" onClick={onReset}>
            Reset
          </Button>
        </div>
      </div>
    </form>
  );
}
