"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  PROMPTS,
  DEFAULT_PROMPT_IDS,
  type PromptDefinition,
} from "@/lib/prompts";
import type { EntryPrompts } from "@/types/database";

const DISPLAY_PROMPTS = PROMPTS.filter((p) => DEFAULT_PROMPT_IDS.includes(p.id));

interface PromptsGridProps {
  prompts: EntryPrompts;
  kissedPrivate: boolean;
  onChange: (p: EntryPrompts, kissedPrivate: boolean) => void;
}

export function PromptsGrid({
  prompts,
  kissedPrivate,
  onChange,
}: PromptsGridProps) {
  const [openPrompt, setOpenPrompt] = useState<PromptDefinition | null>(null);

  const update = (id: string, value: string | number | boolean) => {
    const next = { ...prompts, [id]: value };
    onChange(next, kissedPrivate);
  };

  const completedCount = DISPLAY_PROMPTS.filter((p) => {
    const v = prompts[p.id];
    return v !== undefined && v !== "" && v !== null;
  }).length;

  return (
    <div>
      <h2 className="font-display text-2xl text-white mb-4">Prompts</h2>
      <div className="flex items-center justify-between mb-4">
        <p className="text-nightcap-muted text-sm">
          Tap a card to answer. {completedCount} / {DISPLAY_PROMPTS.length} done
        </p>
        <div className="h-2 flex-1 max-w-32 ml-4 rounded-full bg-nightcap-card overflow-hidden">
          <div
            className="h-full bg-nightcap-accent transition-all"
            style={{
              width: `${(completedCount / DISPLAY_PROMPTS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {DISPLAY_PROMPTS.map((p) => {
          const value = prompts[p.id];
          const hasValue = value !== undefined && value !== "" && value !== null;
          const kissedHasValue = p.id === "kissedAnyone" && (prompts.kissedAnyone !== undefined || (prompts.kissedAnyone === true && prompts.kissedWho));
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setOpenPrompt(p)}
              className={`rounded-xl glass p-4 text-left transition hover:border-nightcap-accent/50 ${
                hasValue || kissedHasValue || (p.id === "tonightsObjective" && prompts.missionCompleted !== undefined) ? "border-nightcap-accent/50" : ""
              }`}
            >
              <p className="text-white text-sm font-medium line-clamp-2">{p.label}</p>
              {hasValue && (
                <p className="text-nightcap-muted text-xs mt-1 truncate">
                  {typeof value === "boolean"
                    ? value
                      ? p.toggleLabels?.[0]
                      : p.toggleLabels?.[1]
                    : String(value)}
                </p>
              )}
              {p.id === "kissedAnyone" && prompts.kissedAnyone === true && prompts.kissedWho && (
                <p className="text-nightcap-muted text-xs mt-1 truncate">{String(prompts.kissedWho)}</p>
              )}
              {p.id === "kissedAnyone" && prompts.kissedAnyone === false && (
                <p className="text-nightcap-muted text-xs mt-1">No</p>
              )}
              {p.id === "tonightsObjective" && prompts.missionCompleted !== undefined && (
                <p className="text-nightcap-muted text-xs mt-1">
                  {prompts.missionCompleted ? "Completed ✓" : "Not completed"}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {openPrompt && (
        <PromptModal
          prompt={openPrompt}
          value={prompts[openPrompt.id]}
          prompts={prompts}
          missionCompleted={typeof prompts.missionCompleted === "boolean" ? prompts.missionCompleted : undefined}
          onSave={(value) => {
            update(openPrompt.id, value);
            setOpenPrompt(null);
          }}
          onClose={() => setOpenPrompt(null)}
          kissedPrivate={kissedPrivate}
          onKissedPrivateChange={
            openPrompt.id === "kissedAnyone"
              ? (v) => onChange(prompts, v)
              : undefined
          }
          onMissionCompletedChange={
            openPrompt.id === "tonightsObjective"
              ? (v) => onChange({ ...prompts, missionCompleted: v }, kissedPrivate)
              : undefined
          }
          onChange={onChange}
        />
      )}
    </div>
  );
}

function PromptModal({
  prompt,
  value,
  prompts,
  missionCompleted,
  onSave,
  onClose,
  kissedPrivate,
  onKissedPrivateChange,
  onMissionCompletedChange,
  onChange,
}: {
  prompt: PromptDefinition;
  value: unknown;
  prompts: EntryPrompts;
  missionCompleted?: boolean;
  onSave: (v: string | number | boolean) => void;
  onClose: () => void;
  kissedPrivate?: boolean;
  onKissedPrivateChange?: (v: boolean) => void;
  onMissionCompletedChange?: (v: boolean) => void;
  onChange: (p: EntryPrompts, kissedPrivate: boolean) => void;
}) {
  const [local, setLocal] = useState(() => {
    if (value !== undefined && value !== null && value !== "") return String(value);
    if (prompt.inputType === "slider") return String(prompt.sliderMin ?? 5);
    if (prompt.inputType === "toggle") return prompt.id === "kissedAnyone" ? "false" : "true";
    return "";
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="glass rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-display text-xl text-white">{prompt.label}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-nightcap-muted hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>

        {prompt.inputType === "text" && (
          <input
            type="text"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            placeholder={prompt.placeholder}
            className="w-full rounded-xl bg-nightcap/80 border border-white/10 px-4 py-3 text-white placeholder:text-nightcap-muted focus:border-nightcap-accent focus:outline-none"
            autoFocus
          />
        )}

        {prompt.inputType === "textarea" && (
          <textarea
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            placeholder={prompt.placeholder}
            rows={3}
            className="w-full rounded-xl bg-nightcap/80 border border-white/10 px-4 py-3 text-white placeholder:text-nightcap-muted focus:border-nightcap-accent focus:outline-none resize-none"
            autoFocus
          />
        )}

        {prompt.inputType === "slider" && (
          <div>
            <input
              type="range"
              min={prompt.sliderMin ?? 1}
              max={prompt.sliderMax ?? 10}
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              className="w-full accent-nightcap-accent"
            />
            <p className="text-center text-nightcap-accent font-display text-2xl mt-2">
              {local}
            </p>
          </div>
        )}

        {prompt.inputType === "toggle" && (
          <div className="flex gap-4">
            {(["true", "false"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setLocal(v)}
                className={`flex-1 rounded-xl py-3 font-medium transition ${
                  local === v
                    ? "bg-nightcap-accent text-white"
                    : "bg-nightcap-card text-nightcap-muted hover:text-white"
                }`}
              >
                {v === "true" ? prompt.toggleLabels?.[0] ?? "Yes" : prompt.toggleLabels?.[1] ?? "No"}
              </button>
            ))}
          </div>
        )}

        {prompt.id === "kissedAnyone" && (
          <>
            {prompts.kissedAnyone === true && (
              <div className="mt-4">
                <p className="text-nightcap-muted text-sm mb-2">Who? (optional)</p>
                <input
                  type="text"
                  value={String(prompts.kissedWho ?? "")}
                  onChange={(e) => onChange({ ...prompts, kissedWho: e.target.value }, kissedPrivate ?? true)}
                  placeholder="Name or details"
                  className="w-full rounded-xl bg-nightcap/80 border border-white/10 px-4 py-3 text-white placeholder:text-nightcap-muted focus:border-nightcap-accent focus:outline-none"
                />
              </div>
            )}
            {onKissedPrivateChange && (
              <label className="flex items-center gap-2 text-sm text-nightcap-muted cursor-pointer mt-4">
                <input
                  type="checkbox"
                  checked={kissedPrivate ?? true}
                  onChange={(e) => onKissedPrivateChange(e.target.checked)}
                  className="rounded"
                />
                Keep this private
              </label>
            )}
          </>
        )}

        {prompt.id === "tonightsObjective" && onMissionCompletedChange && (
          <div className="mt-4">
            <p className="text-nightcap-muted text-sm mb-2">Completed?</p>
            <div className="flex gap-4">
              {([true, false] as const).map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => onMissionCompletedChange(v)}
                  className={`flex-1 rounded-xl py-3 font-medium transition ${
                    missionCompleted === v
                      ? "bg-nightcap-accent text-white"
                      : "bg-nightcap-card text-nightcap-muted hover:text-white"
                  }`}
                >
                  {v ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (prompt.inputType === "slider") {
              onSave(Number(local));
            } else if (prompt.inputType === "toggle") {
              onSave(local === "true");
            } else {
              onSave(local);
            }
          }}
          className="mt-6 w-full rounded-xl bg-nightcap-accent px-4 py-3 font-medium text-white hover:opacity-90"
        >
          Save
        </button>
      </div>
    </div>
  );
}
