"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiGet, apiPost, apiPostForm, apiPut, apiDelete } from "@/lib/api";
import {
  MessageSquare,
  ThumbsUp,
  Send,
  Image as ImageIcon,
  X,
  EyeOff,
  Filter,
  Clock,
  Pencil,
} from "lucide-react";

interface Feedback {
  id: string;
  user_id?: string;
  category: string;
  content: string;
  image_url?: string;
  is_anonymous: boolean;
  upvotes: number;
  has_upvoted: boolean;
  created_at: string;
  updated_at?: string;
}

const categories = ["quality", "quantity", "hygiene", "suggestion"] as const;

const categoryColors: Record<string, string> = {
  quality: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  quantity: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  hygiene: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  suggestion: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function FeedbackPage() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState<string>("");

  const [category, setCategory] = useState<string>("quality");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Lightbox state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchFeedbacks = async () => {
    try {
      const data = await apiGet<Feedback[]>("/api/feedback");
      setFeedbacks(data);
    } catch {
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        setSubmitError("Image must be under 1MB");
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      if (editingId) {
        await apiPut(`/api/feedback/${editingId}`, { category, content });
        setEditingId(null);
      } else {
        const formData = new FormData();
        formData.append("category", category);
        formData.append("content", content);
        formData.append("is_anonymous", String(isAnonymous));
        if (image) formData.append("image", image);
        await apiPostForm("/api/feedback", formData);
      }
      setContent("");
      setCategory("quality");
      setIsAnonymous(false);
      removeImage();
      fetchFeedbacks();
    } catch (err: unknown) {
      console.error("Feedback submit error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitError(msg || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (id: string) => {
    if (!user) return;
    // Optimistic update
    setFeedbacks((prev) =>
      prev.map((fb) =>
        fb.id === id
          ? {
              ...fb,
              has_upvoted: !fb.has_upvoted,
              upvotes: fb.has_upvoted ? fb.upvotes - 1 : fb.upvotes + 1,
            }
          : fb
      )
    );
    try {
      await apiPost(`/api/feedback/${id}/upvote`);
      fetchFeedbacks();
    } catch {
      // Revert on error
      fetchFeedbacks();
    }
  };

  const canEdit = (fb: Feedback) => {
    if (!user || fb.user_id !== user.id) return false;
    const created = new Date(fb.created_at);
    const now = new Date();
    return now.getTime() - created.getTime() < 24 * 60 * 60 * 1000;
  };

  const startEdit = (fb: Feedback) => {
    setEditingId(fb.id);
    setCategory(fb.category);
    setContent(fb.content);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filtered = filterCat
    ? feedbacks.filter((fb) => fb.category === filterCat)
    : feedbacks;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-bold mb-2">
        Hostel <span className="gradient-text">Feedback</span>
      </h1>
      <p className="text-[var(--text-secondary)] mb-8">
        Share your experience and help improve hostel food &amp; services.
      </p>

      {user && (
        <form
          onSubmit={handleSubmit}
          className="glass rounded-2xl p-6 mb-8 space-y-4"
        >
          <h2 className="font-semibold flex items-center gap-2">
            <Send size={16} className="text-[var(--accent-secondary)]" />
            {editingId ? "Edit Feedback" : "Submit Feedback"}
          </h2>

          {submitError && (
            <div className="px-4 py-2 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] text-sm">
              {submitError}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all capitalize ${
                  category === cat
                    ? categoryColors[cat]
                    : "border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--text-secondary)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe your feedback in detail (min 10 characters)..."
            required
            minLength={10}
            maxLength={2000}
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all resize-none"
          />

          {!editingId && (
            <>
              <div className="flex items-center gap-4 flex-wrap">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
                >
                  <ImageIcon size={16} />
                  Attach Image
                </button>

                <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded accent-[var(--accent-primary)]"
                  />
                  <EyeOff size={14} />
                  Post Anonymously
                </label>
              </div>

              {imagePreview && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-xl border border-[var(--border-color)]"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--danger)] text-white flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || content.length < 10}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[#fd79a8] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {editingId ? "Update" : "Submit"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setContent("");
                  setCategory("quality");
                }}
                className="px-6 py-2.5 rounded-xl glass text-[var(--text-secondary)] hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="flex items-center gap-2 mb-6">
        <Filter size={16} className="text-[var(--text-muted)]" />
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterCat("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !filterCat
                ? "bg-[var(--accent-primary)] text-white"
                : "glass text-[var(--text-muted)] hover:text-white"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                filterCat === cat
                  ? "bg-[var(--accent-primary)] text-white"
                  : "glass text-[var(--text-muted)] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-[var(--bg-card)] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-secondary)]">No feedback yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((fb) => (
            <div key={fb.id} className="glass rounded-2xl p-5 card-hover">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium border capitalize ${categoryColors[fb.category]}`}>
                    {fb.category}
                  </span>
                  {fb.is_anonymous && (
                    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <EyeOff size={12} /> Anonymous
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {canEdit(fb) && (
                    <button
                      onClick={() => startEdit(fb)}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-white transition-all"
                      title="Edit (within 24h)"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <Clock size={12} />
                    {new Date(fb.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>

              <p className="text-[var(--text-primary)] mb-3 leading-relaxed">{fb.content}</p>

              {fb.image_url && (
                <img
                  src={fb.image_url}
                  alt="Feedback"
                  onClick={() => setLightboxUrl(fb.image_url!)}
                  className="w-full max-w-xs rounded-xl mb-3 border border-[var(--border-color)] cursor-pointer hover:opacity-80 transition-opacity"
                />
              )}

              <button
                onClick={() => handleUpvote(fb.id)}
                disabled={!user}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all disabled:opacity-50 ${
                  fb.has_upvoted
                    ? "bg-[var(--accent-primary)]/20 text-[var(--accent-secondary)] border border-[var(--accent-primary)]/40"
                    : "glass text-[var(--text-secondary)] hover:text-[var(--accent-secondary)] hover:border-[var(--accent-primary)]"
                }`}
              >
                <ThumbsUp size={14} className={fb.has_upvoted ? "fill-current" : ""} />
                {fb.upvotes}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-[var(--danger)] text-white flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
            >
              <X size={16} />
            </button>
            <img
              src={lightboxUrl}
              alt="Feedback image full view"
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl border border-[var(--border-color)]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
