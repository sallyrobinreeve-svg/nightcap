"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Camera, MessageCircle, MapPin, Users } from "lucide-react";
import {
  StepDate,
  StepPhotos,
  StepRating,
  StepTimeline,
  StepTagFriends,
  StepReview,
} from "./EntryWizardSteps";
import { PromptsGrid } from "./PromptsGrid";
import type { EntryPrompts, TimelineStep as TimelineStepType } from "@/types/database";
import { fetchJson } from "@/lib/fetch-client";

export interface WizardData {
  dateOfNight: string;
  outfitPhotoUrl: string | null;
  favouritePhotoUrl: string | null;
  videoUrl: string | null;
  rating: number | null;
  prompts: EntryPrompts;
  kissedPrivate: boolean;
  timelineSteps: TimelineStepType[];
  taggedUserIds: string[];
  visibility: "private" | "friends" | "public";
}

const STEPS = [
  { id: "date", label: "Date", icon: null },
  { id: "photos", label: "Photos", icon: Camera },
  { id: "rating", label: "Rating", icon: Star },
  { id: "prompts", label: "Prompts", icon: MessageCircle },
  { id: "timeline", label: "Timeline", icon: MapPin },
  { id: "tags", label: "Tag friends", icon: Users },
  { id: "review", label: "Review", icon: null },
];

const initialData: WizardData = {
  dateOfNight: new Date().toISOString().slice(0, 10),
  outfitPhotoUrl: null,
  favouritePhotoUrl: null,
  videoUrl: null,
  rating: null,
  prompts: {},
  kissedPrivate: true,
  timelineSteps: [],
  taggedUserIds: [],
  visibility: "friends",
};

interface EntryWizardProps {
  userId: string;
  entryId?: string;
  initialData?: Partial<WizardData>;
}

export function EntryWizard({ userId, entryId, initialData: customInitial }: EntryWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({ ...initialData, ...customInitial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateData = (updates: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return !!data.dateOfNight;
      case 1:
        return true;
      case 2:
        return data.rating !== null;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      case 6:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const url = entryId ? `/api/entries/${entryId}` : "/api/entries";
      const result = await fetchJson(url, {
        method: entryId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          dateOfNight: data.dateOfNight,
          outfitPhotoUrl: data.outfitPhotoUrl,
          favouritePhotoUrl: data.favouritePhotoUrl,
          videoUrl: data.videoUrl,
          rating: data.rating,
          prompts: data.prompts,
          kissedPrivate: data.kissedPrivate,
          timelineSteps: data.timelineSteps,
          taggedUserIds: data.taggedUserIds,
          visibility: data.visibility,
        }),
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push(entryId ? `/entries/${entryId}` : "/entries");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition whitespace-nowrap ${
                step === i
                  ? "bg-nightcap-accent text-white"
                  : "bg-nightcap-card/60 text-nightcap-muted hover:text-white"
              }`}
            >
              {Icon && <Icon size={16} />}
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="glass rounded-2xl p-8">
        {step === 0 && (
          <StepDate
            dateOfNight={data.dateOfNight}
            onChange={(dateOfNight) => updateData({ dateOfNight })}
          />
        )}
        {step === 1 && (
          <StepPhotos
            outfitPhotoUrl={data.outfitPhotoUrl}
            favouritePhotoUrl={data.favouritePhotoUrl}
            videoUrl={data.videoUrl}
            onChange={(outfitPhotoUrl, favouritePhotoUrl, videoUrl) =>
              updateData({ outfitPhotoUrl, favouritePhotoUrl, videoUrl })
            }
            userId={userId}
          />
        )}
        {step === 2 && (
          <StepRating
            rating={data.rating}
            onChange={(rating) => updateData({ rating })}
          />
        )}
        {step === 3 && (
          <PromptsGrid
            prompts={data.prompts}
            kissedPrivate={data.kissedPrivate}
            onChange={(prompts, kissedPrivate) =>
              updateData({ prompts, kissedPrivate })
            }
          />
        )}
        {step === 4 && (
          <StepTimeline
            steps={data.timelineSteps}
            onChange={(timelineSteps) => updateData({ timelineSteps })}
          />
        )}
        {step === 5 && (
          <StepTagFriends
            taggedUserIds={data.taggedUserIds}
            onChange={(taggedUserIds) => updateData({ taggedUserIds })}
            currentUserId={userId}
          />
        )}
        {step === 6 && (
          <StepReview
            data={data}
            visibility={data.visibility}
            onVisibilityChange={(visibility) => updateData({ visibility })}
          />
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm">{"\u26a0"} {error}</p>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0}
          className="rounded-xl glass px-6 py-3 font-medium text-white transition hover:border-nightcap-accent/50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed() || saving}
          className="rounded-xl bg-nightcap-accent px-6 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : step === STEPS.length - 1
              ? (entryId ? "Update entry" : "Post entry")
              : "Next"}
        </button>
      </div>
    </div>
  );
}
