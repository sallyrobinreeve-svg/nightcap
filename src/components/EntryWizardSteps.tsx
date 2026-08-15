"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import type { TimelineStep, TimelineStepType } from "@/types/database";
import { GripVertical, Plus, X } from "lucide-react";
import { PROMPTS, TIMELINE_EMOJIS } from "@/lib/prompts";
import { fetchJson } from "@/lib/fetch-client";
import type { WizardData } from "./EntryWizard";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const STEP_TYPES: { value: TimelineStepType; label: string }[] = [
  { value: "pres", label: "Pres" },
  { value: "club", label: "Club" },
  { value: "bar", label: "Bar" },
  { value: "afters", label: "Afters" },
  { value: "other", label: "Other" },
];

export function StepDate({
  dateOfNight,
  onChange,
}: {
  dateOfNight: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl text-white mb-4">When was the night?</h2>
      <input
        type="date"
        value={dateOfNight}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-nightcap/80 border border-white/10 px-4 py-3 text-white focus:border-nightcap-accent focus:outline-none"
      />
    </div>
  );
}

export function StepPhotos({
  outfitPhotoUrl,
  favouritePhotoUrl,
  videoUrl,
  onChange,
  userId,
}: {
  outfitPhotoUrl: string | null;
  favouritePhotoUrl: string | null;
  videoUrl: string | null;
  onChange: (outfit: string | null, favourite: string | null, video: string | null) => void;
  userId: string;
}) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    import("@capacitor/core").then(({ Capacitor }) => {
      setIsNative(Capacitor.isNativePlatform());
    });
  }, []);

  const uploadFile = useCallback(
    async (file: File, type: "outfit" | "favourite" | "video"): Promise<string | null> => {
      setUploading(type);
      setUploadError(null);
      try {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("type", type);
        formData.set("userId", userId);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        const { url } = await res.json();
        return url;
      } catch {
        setUploadError("Failed to upload. Please try again.");
        return null;
      } finally {
        setUploading(null);
      }
    },
    [userId]
  );

  const onDropOutfit = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      const url = await uploadFile(file, "outfit");
      if (url) onChange(url, favouritePhotoUrl, videoUrl);
    },
    [favouritePhotoUrl, videoUrl, onChange, uploadFile]
  );

  const onDropFavourite = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      const url = await uploadFile(file, "favourite");
      if (url) onChange(outfitPhotoUrl, url, videoUrl);
    },
    [outfitPhotoUrl, videoUrl, onChange, uploadFile]
  );

  const onDropVideo = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      const url = await uploadFile(file, "video");
      if (url) onChange(outfitPhotoUrl, favouritePhotoUrl, url);
    },
    [outfitPhotoUrl, favouritePhotoUrl, onChange, uploadFile]
  );

  const pickNativePhoto = useCallback(
    async (type: "outfit" | "favourite") => {
      if (uploading) return;
      try {
        const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
        const photo = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Photos,
        });
        if (!photo.base64String) return;
        const binary = atob(photo.base64String);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const format = photo.format || "jpeg";
        const blob = new Blob([bytes], { type: `image/${format}` });
        const file = new File([blob], `${type}.${format === "jpeg" ? "jpg" : format}`, {
          type: blob.type,
        });
        const url = await uploadFile(file, type);
        if (!url) return;
        if (type === "outfit") {
          onChange(url, favouritePhotoUrl, videoUrl);
        } else {
          onChange(outfitPhotoUrl, url, videoUrl);
        }
      } catch {
        setUploadError("Failed to upload. Please try again.");
      }
    },
    [favouritePhotoUrl, outfitPhotoUrl, onChange, uploadFile, uploading, videoUrl]
  );

  const { getRootProps: getOutfitProps, getInputProps: getOutfitInputProps } =
    useDropzone({
      onDrop: onDropOutfit,
      accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"] },
      maxFiles: 1,
      disabled: uploading !== null,
    });

  const { getRootProps: getFavouriteProps, getInputProps: getFavouriteInputProps } =
    useDropzone({
      onDrop: onDropFavourite,
      accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"] },
      maxFiles: 1,
      disabled: uploading !== null,
    });

  const { getRootProps: getVideoProps, getInputProps: getVideoInputProps } =
    useDropzone({
      onDrop: onDropVideo,
      accept: { "video/*": [".mp4", ".webm", ".mov", ".avi"] },
      maxFiles: 1,
      disabled: uploading !== null,
    });

  return (
    <div>
      <h2 className="font-display text-2xl text-white mb-4">Photos</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-nightcap-muted text-sm mb-2">Outfit of the night</p>
          <div
            {...(isNative ? { onClick: () => pickNativePhoto("outfit") } : getOutfitProps())}
            className="rounded-xl border-2 border-dashed border-nightcap-muted p-6 text-center cursor-pointer hover:border-nightcap-accent/50 transition min-h-[160px] flex items-center justify-center"
          >
            {!isNative && <input {...getOutfitInputProps()} />}
            {outfitPhotoUrl ? (
              <div className="relative w-full max-h-64 flex items-center justify-center">
                <Image
                  src={outfitPhotoUrl}
                  alt="Outfit"
                  width={800}
                  height={600}
                  className="max-h-64 w-auto h-auto object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(null, favouritePhotoUrl, videoUrl);
                  }}
                  className="absolute top-1 right-1 rounded-full bg-nightcap-accent p-1 text-white"
                >
                  <X size={14} />
                </button>
              </div>
            ) : uploading === "outfit" ? (
              <p className="text-nightcap-muted">Uploading...</p>
            ) : (
              <p className="text-nightcap-muted">{isNative ? "Tap to choose from library" : "Drop or click to upload"}</p>
            )}
          </div>
        </div>
        <div>
          <p className="text-nightcap-muted text-sm mb-2">Favourite photo of the night</p>
          <div
            {...(isNative ? { onClick: () => pickNativePhoto("favourite") } : getFavouriteProps())}
            className="rounded-xl border-2 border-dashed border-nightcap-muted p-6 text-center cursor-pointer hover:border-nightcap-accent/50 transition min-h-[160px] flex items-center justify-center"
          >
            {!isNative && <input {...getFavouriteInputProps()} />}
            {favouritePhotoUrl ? (
              <div className="relative w-full max-h-64 flex items-center justify-center">
                <Image
                  src={favouritePhotoUrl}
                  alt="Favourite"
                  width={800}
                  height={600}
                  className="max-h-64 w-auto h-auto object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(outfitPhotoUrl, null, videoUrl);
                  }}
                  className="absolute top-1 right-1 rounded-full bg-nightcap-accent p-1 text-white"
                >
                  <X size={14} />
                </button>
              </div>
            ) : uploading === "favourite" ? (
              <p className="text-nightcap-muted">Uploading...</p>
            ) : (
              <p className="text-nightcap-muted">{isNative ? "Tap to choose from library" : "Drop or click to upload"}</p>
            )}
          </div>
        </div>
        <div className="sm:col-span-2">
          <p className="text-nightcap-muted text-sm mb-2">Video highlight (optional)</p>
          <div
            {...(isNative ? {} : getVideoProps())}
            className="rounded-xl border-2 border-dashed border-nightcap-muted p-6 text-center cursor-pointer hover:border-nightcap-accent/50 transition min-h-[120px] flex items-center justify-center"
          >
            {!isNative && <input {...getVideoInputProps()} />}
            {videoUrl ? (
              <div className="flex items-center gap-3 w-full">
                <div className="w-24 h-16 rounded-lg bg-nightcap-card flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🎬</span>
                </div>
                <p className="text-nightcap-muted text-sm flex-1 truncate">Video added</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(outfitPhotoUrl, favouritePhotoUrl, null);
                  }}
                  className="rounded-full bg-nightcap-accent p-1 text-white flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ) : uploading === "video" ? (
              <p className="text-nightcap-muted">Uploading...</p>
            ) : (
              <p className="text-nightcap-muted">
                {isNative ? "Video upload is available on the web app" : "Drop or click for video (mp4, webm, mov)"}
              </p>
            )}
          </div>
        </div>
      </div>
      {uploadError && <p className="text-red-400 text-sm mt-3">{uploadError}</p>}
      <p className="text-nightcap-muted text-sm mt-2">All optional. Add what you have!</p>
    </div>
  );
}

export function StepRating({
  rating,
  onChange,
}: {
  rating: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl text-white mb-4">Rate your night</h2>
      <div className="flex gap-3 justify-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`rounded-full w-14 h-14 flex items-center justify-center transition ${
              rating === n
                ? "bg-nightcap-yellow text-nightcap shadow-lg shadow-nightcap-yellow/30"
                : "bg-nightcap-card/80 text-nightcap-muted hover:text-white"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="text-center text-nightcap-muted mt-2">
        {rating ? `${rating} / 5 stars` : "Tap to rate"}
      </p>
    </div>
  );
}

function SortableTimelineStep({
  step,
  onUpdate,
  onRemove,
}: {
  step: TimelineStep;
  onUpdate: (id: string, updates: Partial<TimelineStep>) => void;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl glass p-4 flex gap-3 items-start ${isDragging ? "opacity-70" : ""}`}
    >
      <button
        type="button"
        className="touch-none p-1.5 cursor-grab active:cursor-grabbing text-nightcap-muted hover:text-white flex-shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={20} />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-nightcap-muted text-xs mb-1">Emoji</p>
        <div className="flex gap-1 overflow-x-auto pb-2 mb-2">
          {TIMELINE_EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() =>
                onUpdate(step.id, { emoji: step.emoji === em ? null : em })
              }
              className={`text-xl leading-tight w-9 h-9 flex items-center justify-center rounded-lg shrink-0 transition ${
                step.emoji === em
                  ? "bg-nightcap-accent/50"
                  : "bg-nightcap-card/60 hover:bg-nightcap-card"
              }`}
            >
              {em}
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <select
            value={step.type}
            onChange={(e) =>
              onUpdate(step.id, { type: e.target.value as TimelineStepType })
            }
            className="rounded-lg bg-nightcap/80 border border-white/10 px-3 py-2 text-white text-sm focus:border-nightcap-accent focus:outline-none"
          >
            {STEP_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={step.location_name ?? ""}
            onChange={(e) =>
              onUpdate(step.id, { location_name: e.target.value || null })
            }
            placeholder="Location name"
            className="rounded-lg bg-nightcap/80 border border-white/10 px-3 py-2 text-white text-sm placeholder:text-nightcap-muted focus:border-nightcap-accent focus:outline-none"
          />
          <input
            type="time"
            value={step.time_at ?? ""}
            onChange={(e) =>
              onUpdate(step.id, {
                time_at: e.target.value ? `${e.target.value}:00` : null,
              })
            }
            className="rounded-lg bg-nightcap/80 border border-white/10 px-3 py-2 text-white text-sm focus:border-nightcap-accent focus:outline-none sm:col-span-2"
          />
          <input
            type="text"
            value={step.notes ?? ""}
            onChange={(e) =>
              onUpdate(step.id, { notes: e.target.value || null })
            }
            placeholder="Notes"
            className="rounded-lg bg-nightcap/80 border border-white/10 px-3 py-2 text-white text-sm placeholder:text-nightcap-muted focus:border-nightcap-accent focus:outline-none sm:col-span-2"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(step.id)}
        className="text-red-400 hover:text-red-300 p-1 flex-shrink-0"
      >
        <X size={18} />
      </button>
    </div>
  );
}

export function StepTimeline({
  steps,
  onChange,
}: {
  steps: TimelineStep[];
  onChange: (s: TimelineStep[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = steps.findIndex((s) => s.id === active.id);
    const newIndex = steps.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(steps, oldIndex, newIndex);
    reordered.forEach((s, i) => (s.sort_order = i));
    onChange(reordered);
  };

  const addStep = () => {
    onChange([
      ...steps,
      {
        id: crypto.randomUUID(),
        entry_id: "",
        type: "pres",
        emoji: null,
        location_name: "",
        time_at: null,
        notes: null,
        photo_url: null,
        sort_order: steps.length,
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const updateStep = (id: string, updates: Partial<TimelineStep>) => {
    onChange(steps.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeStep = (id: string) => {
    onChange(steps.filter((s) => s.id !== id));
  };

  return (
    <div>
      <h2 className="font-display text-2xl text-white mb-4">Your journey</h2>
      <p className="text-nightcap-muted text-sm mb-4">
        Add where you went – Pres → Club → Afters? Drag to reorder.
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={steps.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {steps.map((s) => (
              <SortableTimelineStep
                key={s.id}
                step={s}
                onUpdate={updateStep}
                onRemove={removeStep}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        type="button"
        onClick={addStep}
        className="mt-4 flex items-center gap-2 rounded-xl glass px-4 py-2 text-nightcap-accent hover:border-nightcap-accent/50 transition"
      >
        <Plus size={18} />
        Add step
      </button>
    </div>
  );
}

export function StepTagFriends({
  taggedUserIds,
  onChange,
  currentUserId,
}: {
  taggedUserIds: string[];
  onChange: (ids: string[]) => void;
  currentUserId: string;
}) {
  const [friends, setFriends] = useState<{ id: string; display_name: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await fetchJson<{ friends?: { id: string; display_name: string | null }[] }>(
          "/api/friends"
        );
        if (!cancelled && result.ok) {
          setFriends(result.data.friends || []);
        } else if (!cancelled) {
          setFriends([]);
        }
      } catch {
        if (!cancelled) setFriends([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (id: string) => {
    if (taggedUserIds.includes(id)) {
      onChange(taggedUserIds.filter((x) => x !== id));
    } else {
      onChange([...taggedUserIds, id]);
    }
  };

  return (
    <div>
      <h2 className="font-display text-2xl text-white mb-4">Tag friends</h2>
      <p className="text-nightcap-muted text-sm mb-4">
        Who were you out with? (Optional – only people you follow)
      </p>
      {loading ? (
        <p className="text-nightcap-muted">Loading...</p>
      ) : friends.length === 0 ? (
        <p className="text-nightcap-muted">Follow friends first to tag them in entries.</p>
      ) : (
        <div className="space-y-2">
          {friends.map((f) => (
            <label
              key={f.id}
              className="flex items-center gap-3 glass rounded-xl p-4 cursor-pointer transition hover:border-nightcap-accent/30"
            >
              <input
                type="checkbox"
                checked={taggedUserIds.includes(f.id)}
                onChange={() => toggle(f.id)}
                className="rounded"
              />
              <span className="text-white">{f.display_name || "Unknown"}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function StepReview({
  data,
  visibility,
  onVisibilityChange,
}: {
  data: WizardData;
  visibility: "private" | "friends" | "public";
  onVisibilityChange: (v: "private" | "friends" | "public") => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl text-white mb-4">Review & post</h2>

      <div className="space-y-4">
        <div>
          <span className="text-nightcap-muted text-sm">Date</span>
          <p className="text-white">{data.dateOfNight}</p>
        </div>
        <div>
          <span className="text-nightcap-muted text-sm">Rating</span>
          <p className="text-white">{data.rating ? `${data.rating} / 5` : "–"}</p>
        </div>
        {data.videoUrl && (
          <div>
            <span className="text-nightcap-muted text-sm">Video</span>
            <p className="text-white truncate">{data.videoUrl ? "Added" : "–"}</p>
          </div>
        )}
        {Object.entries(data.prompts).filter(([k, v]) => !["missionCompleted", "kissedPrivate"].includes(k) && v !== undefined && v !== "" && v !== null).length > 0 && (
          <div>
            <span className="text-nightcap-muted text-sm">Prompts</span>
            <ul className="list-disc list-inside text-white space-y-1 mt-1">
              {PROMPTS.filter((p) => {
                const v = data.prompts[p.id];
                return v !== undefined && v !== "" && v !== null;
              }).map((p) => (
                <li key={p.id}>
                  {p.label}:{" "}
                  {typeof data.prompts[p.id] === "boolean"
                    ? data.prompts[p.id]
                      ? p.toggleLabels?.[0] ?? "Yes"
                      : p.toggleLabels?.[1] ?? "No"
                    : String(data.prompts[p.id])}
                  {(p.id === "kissedAnyone" || p.id === "kissedWho") && data.kissedPrivate && " (private)"}
                  {p.id === "tonightsObjective" && data.prompts.missionCompleted !== undefined && (
                    data.prompts.missionCompleted ? " ✓ Completed" : " (not completed)"
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.timelineSteps.length > 0 && (
          <div>
            <span className="text-nightcap-muted text-sm">Timeline</span>
            <ul className="text-white mt-1 space-y-1">
              {data.timelineSteps.map((s) => (
                <li key={s.id}>
                  {s.emoji && `${s.emoji} `}
                  {s.type} – {s.location_name || "…"}
                  {s.time_at && ` @ ${s.time_at.slice(0, 5)}`}
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.taggedUserIds && data.taggedUserIds.length > 0 && (
          <div>
            <span className="text-nightcap-muted text-sm">Tagged</span>
            <p className="text-white mt-1">{data.taggedUserIds.length} friend(s)</p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-nightcap-muted text-sm mb-2">Visibility</label>
        <select
          value={visibility}
          onChange={(e) =>
            onVisibilityChange(e.target.value as "private" | "friends" | "public")
          }
          className="w-full rounded-xl bg-nightcap/80 border border-white/10 px-4 py-3 text-white focus:border-nightcap-accent focus:outline-none"
        >
          <option value="private">Private (only you)</option>
          <option value="friends">Friends only</option>
          <option value="public">Public</option>
        </select>
      </div>
    </div>
  );
}
