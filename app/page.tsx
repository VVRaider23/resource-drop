"use client";

import { useEffect, useState } from "react";
import { supabase, type Resource, type Tag } from "@/lib/supabase";

const TAG_STYLES: Record<Tag, { bg: string; text: string; label: string }> = {
  design: { bg: "#2d1f4a", text: "#c084fc", label: "Design" },
  product: { bg: "#1f3a2d", text: "#4ade80", label: "Product" },
  tech: { bg: "#1f2d4a", text: "#60a5fa", label: "Tech" },
  career: { bg: "#3a2d1f", text: "#fb923c", label: "Career" },
  general: { bg: "#2a2a38", text: "#94a3b8", label: "General" },
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const INITIAL_FORM = { title: "", url: "", tag: "general" as Tag, submitted_by: "" };

export default function Home() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [resources, setResources] = useState<Resource[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    fetchResources();

    const channel = supabase
      .channel("resources")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "resources" }, (payload) => {
        setResources((prev) => [payload.new as Resource, ...prev]);
      })
      .subscribe();

    const timer = setInterval(() => setTick((t) => t + 1), 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, []);

  async function fetchResources() {
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError("Failed to load resources.");
      return;
    }
    setResources(data as Resource[]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const url = form.url.trim();
    const title = form.title.trim();
    const submitted_by = form.submitted_by.trim();

    if (!title || !url || !submitted_by) {
      setError("Please fill in all fields.");
      return;
    }

    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

    setSubmitting(true);
    const { error: err } = await supabase.from("resources").insert([
      { title, url: normalizedUrl, tag: form.tag, submitted_by },
    ]);
    setSubmitting(false);

    if (err) {
      setError("Failed to submit. Please try again.");
      return;
    }

    setForm(INITIAL_FORM);
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0f" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 20px 80px" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#f0f0f8",
            letterSpacing: "-0.5px",
            marginBottom: 6,
          }}>
            Resource Drop
          </h1>
          <p style={{ color: "#55556a", fontSize: 14 }}>Share links worth saving.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          backgroundColor: "#111118",
          border: "1px solid #1e1e2a",
          borderRadius: 12,
          padding: 24,
          marginBottom: 40,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#8888aa", fontWeight: 500 }}>Title</label>
              <input
                type="text"
                placeholder="Figma Variables Guide"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#8888aa", fontWeight: 500 }}>URL</label>
              <input
                type="text"
                placeholder="figma.com/blog/..."
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#8888aa", fontWeight: 500 }}>Tag</label>
              <select
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value as Tag })}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {(Object.keys(TAG_STYLES) as Tag[]).map((t) => (
                  <option key={t} value={t}>{TAG_STYLES[t].label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#8888aa", fontWeight: 500 }}>Your name</label>
              <input
                type="text"
                placeholder="Alex"
                value={form.submitted_by}
                onChange={(e) => setForm({ ...form, submitted_by: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 4,
              height: 40,
              backgroundColor: submitting ? "#3a3a58" : "#6c6cff",
              color: submitting ? "#8888aa" : "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              transition: "background-color 0.15s",
              letterSpacing: "0.1px",
            }}
          >
            {submitting ? "Submitting..." : "Drop it"}
          </button>
        </form>

        {/* Feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {resources.length === 0 ? (
            <p style={{ color: "#55556a", fontSize: 14, textAlign: "center", paddingTop: 40 }}>
              No resources yet. Be the first to drop one.
            </p>
          ) : (
            resources.map((r) => {
              const tag = TAG_STYLES[r.tag as Tag] ?? TAG_STYLES.general;
              return (
                <div
                  key={r.id}
                  style={{
                    backgroundColor: "#111118",
                    border: "1px solid #1e1e2a",
                    borderRadius: 10,
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: 8,
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2a2a38")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e1e2a")}
                >
                  {/* Tag badge */}
                  <span style={{
                    flexShrink: 0,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.4px",
                    textTransform: "uppercase",
                    backgroundColor: tag.bg,
                    color: tag.text,
                    borderRadius: 5,
                    padding: "3px 8px",
                  }}>
                    {tag.label}
                  </span>

                  {/* Title link */}
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      color: "#e0e0f0",
                      fontSize: 14,
                      fontWeight: 500,
                      textDecoration: "none",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#6c6cff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#e0e0f0")}
                  >
                    {r.title}
                  </a>

                  {/* Meta */}
                  <div style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 12,
                    color: "#55556a",
                    whiteSpace: "nowrap",
                  }}>
                    <span>{r.submitted_by}</span>
                    <span style={{ color: "#2a2a38" }}>·</span>
                    <span>{relativeTime(r.created_at)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  height: 40,
  backgroundColor: "#1a1a24",
  border: "1px solid #2a2a38",
  borderRadius: 8,
  padding: "0 12px",
  fontSize: 14,
  color: "#f0f0f8",
  width: "100%",
  transition: "border-color 0.15s",
};
