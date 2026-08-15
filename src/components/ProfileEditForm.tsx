"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SafeImage } from "@/components/SafeImage";
import { fetchJson } from "@/lib/fetch-client";
import { useDropzone } from "react-dropzone";
import { BottomNav } from "@/components/BottomNav";
import Link from "next/link";

interface ProfileEditFormProps {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

async function uploadAvatarFile(file: File, userId: string): Promise<string> {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("type", "avatar");
  formData.set("userId", userId);
  const result = await fetchJson<{ url?: string }>("/api/upload", { method: "POST", body: formData });
  if (!result.ok) throw new Error(result.message);
  if (!result.data.url) throw new Error("Upload didn’t return a URL");
  return result.data.url;
}

export function ProfileEditForm({
  userId,
  displayName,
  avatarUrl,
  bio,
}: ProfileEditFormProps) {
  const router = useRouter();
  const [display_name, setDisplayName] = useState(displayName ?? "");
  const [avatar_url, setAvatarUrl] = useState(avatarUrl);
  const [bioText, setBio] = useState(bio ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    import("@capacitor/core").then(({ Capacitor }) => {
      setIsNative(Capacitor.isNativePlatform());
    });
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setUploading(true);
      try {
        const url = await uploadAvatarFile(file, userId);
        setAvatarUrl(url);
      } catch {
        setError("Failed to upload photo");
      } finally {
        setUploading(false);
      }
    },
    [userId]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"] },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleNativePhotoPick = useCallback(async () => {
    if (uploading) return;
    try {
      const { Camera, CameraSource, CameraResultType } = await import("@capacitor/camera");
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos, // Gallery only – avoids "Take Photo" crash on iPad
      });
      if (!photo.base64String) return;
      setUploading(true);
      const binary = atob(photo.base64String);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: `image/${photo.format || "jpeg"}` });
      const file = new File([blob], `avatar.${photo.format || "jpg"}`, { type: blob.type });
      const url = await uploadAvatarFile(file, userId);
      setAvatarUrl(url);
    } catch {
      setError("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  }, [userId, uploading]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await fetchJson("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: display_name.trim() || null,
          avatar_url: avatar_url || null,
          bio: bioText.trim() || null,
        }),
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push("/profile");
      router.refresh();
    } catch {
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-nightcap pb-24">
      <nav className="glass sticky top-0 z-10 border-b border-white/5">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/profile" className="font-display text-2xl text-nightcap-accent hover:opacity-90">
            ← Back
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-display text-4xl text-white mb-8">Edit profile</h1>

        <div className="glass rounded-2xl p-8 space-y-6">
          <div>
            <p className="text-nightcap-muted text-sm mb-2">Profile picture</p>
            <div
              {...(isNative ? { onClick: handleNativePhotoPick } : getRootProps())}
              className="w-28 h-28 rounded-full overflow-hidden bg-nightcap-muted border-2 border-dashed border-nightcap-muted flex items-center justify-center cursor-pointer hover:border-nightcap-accent/50 transition"
            >
              {!isNative && <input {...getInputProps()} />}
              {avatar_url ? (
                <SafeImage
                  src={avatar_url}
                  alt=""
                  width={112}
                  height={112}
                  className="object-cover w-full h-full"
                  fallbackLetter={(display_name || "?")[0]}
                />
              ) : uploading ? (
                <span className="text-nightcap-muted text-sm">Uploading...</span>
              ) : (
                <span className="text-nightcap-muted text-4xl">
                  {(display_name || "?")[0].toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-nightcap-muted text-xs mt-2">Tap to change</p>
          </div>

          <div>
            <label className="block text-nightcap-muted text-sm mb-2">Display name</label>
            <input
              type="text"
              value={display_name}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl bg-nightcap/80 border border-white/10 px-4 py-3 text-white placeholder:text-nightcap-muted focus:border-nightcap-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-nightcap-muted text-sm mb-2">Bio</label>
            <textarea
              value={bioText}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A few words about you..."
              rows={3}
              className="w-full rounded-xl bg-nightcap/80 border border-white/10 px-4 py-3 text-white placeholder:text-nightcap-muted focus:border-nightcap-accent focus:outline-none resize-none"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-nightcap-accent px-4 py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
