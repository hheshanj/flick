"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { formatFileSize } from "@/lib/utils";

interface SharePageClientProps {
  fileName: string;
  fileSize: number;
  mimeType: string;
  token: string;
  initialTimeRemaining: number;
  hasPassword: boolean;
  maxDownloads: number;
  downloadCount: number;
}

function formatTime(ms: number): string {
  if (ms <= 0) return "Expired";
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export default function SharePageClient({
  fileName,
  fileSize,
  mimeType,
  token,
  initialTimeRemaining,
  hasPassword,
  maxDownloads,
  downloadCount,
}: SharePageClientProps) {
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(hasPassword);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [localDownloadCount, setLocalDownloadCount] = useState(downloadCount);

  const downloadsRemaining = maxDownloads > 0 ? maxDownloads - localDownloadCount : null;
  const isDownloadLimited = maxDownloads > 0 && downloadsRemaining !== null && downloadsRemaining <= 0;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          clearInterval(interval);
          router.refresh();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  const handleDownload = async () => {
    if (passwordRequired && !password) {
      setPasswordError("Password is required");
      return;
    }

    setDownloading(true);
    setError(null);
    setPasswordError(null);

    try {
      const url = new URL(`/api/download/${token}`, window.location.origin);
      if (password) {
        url.searchParams.set("password", password);
      }

      const response = await fetch(url.toString());

      if (response.status === 401) {
        const data = await response.json();
        if (data.requiresPassword) {
          setPasswordRequired(true);
          setPasswordError("Password is required");
        } else {
          setPasswordError("Incorrect password");
        }
        setDownloading(false);
        return;
      }

      if (response.status === 410) {
        setError("This file has securely self-destructed.");
        setTimeRemaining(0);
        return;
      }

      if (response.status === 403) {
        setError("Download limit reached. This file can no longer be downloaded.");
        return;
      }

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      if (maxDownloads > 0) {
        setLocalDownloadCount((prev) => prev + 1);
      }
    } catch {
      setError("Failed to download the file over the network. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (timeRemaining <= 0) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="glass rounded-3xl p-10 max-w-md w-full text-center relative z-10 border border-red-500/10">
          <div className="w-20 h-20 bg-gradient-to-tr from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)] text-red-400">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight text-white">File Expired</h1>
          <p className="text-gray-400 text-lg font-medium mb-8">
            This file has self-destructed and is forever gone from our servers.
          </p>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-white/5 hover:bg-white/10 transition rounded-xl text-gray-300 font-medium">
            Share a New File
          </button>
        </div>
      </main>
    );
  }

  const progressPercent = Math.max(0, (timeRemaining / initialTimeRemaining) * 100);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-lg relative z-10">
        <div className="glass rounded-3xl shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-2 bg-white/5">
            <div 
              className={clsx(
                "h-full transition-all duration-1000 ease-linear shadow-[0_0_15px_currentColor]",
                progressPercent > 50 ? "bg-emerald-400 text-emerald-400" : progressPercent > 20 ? "bg-amber-400 text-amber-400" : "bg-red-500 text-red-500"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="p-8">
            <div className="text-center mb-8 pt-4">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20 rotate-3">
                <svg className="w-10 h-10 text-white -rotate-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-extrabold mb-2 text-white break-words tracking-tight leading-tight px-4">{fileName}</h1>
              <p className="text-indigo-400 font-medium text-lg">{formatFileSize(fileSize)}</p>
            </div>

            <div className="bg-black/30 border border-white/5 rounded-2xl p-6 mb-6 text-center relative overflow-hidden backdrop-blur-md">
              <span className="block text-xs text-gray-400 mb-2 uppercase tracking-widest font-semibold">Self-Destructs In</span>
              <span className={clsx(
                "font-mono font-bold text-4xl tracking-tight transition-colors duration-1000",
                progressPercent > 20 ? "text-white" : "text-red-400 animate-pulse"
              )}>
                {formatTime(timeRemaining)}
              </span>
            </div>

            {maxDownloads > 0 && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 mb-6 text-center">
                <div className="flex items-center justify-center gap-2 text-indigo-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="font-medium">
                    {downloadsRemaining} download{downloadsRemaining === 1 ? "" : "s"} remaining
                  </span>
                </div>
              </div>
            )}

            {passwordRequired && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                  Password Required
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    placeholder="Enter password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-2 text-sm text-red-400">{passwordError}</p>
                )}
              </div>
            )}

            {(error || passwordError) && !isDownloadLimited && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 font-medium flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error || passwordError}
              </div>
            )}

            {isDownloadLimited ? (
              <div className="w-full bg-gray-600 text-white py-4 px-6 rounded-2xl font-bold text-lg text-center cursor-not-allowed opacity-50">
                Download Limit Reached
              </div>
            ) : (
              <button
                onClick={handleDownload}
                disabled={downloading || timeRemaining <= 0}
                className="w-full bg-gradient-to-r from-teal-400 to-emerald-500 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:from-teal-300 hover:to-emerald-400 transition-all duration-300 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_30px_rgba(52,211,153,0.5)] border border-emerald-400/30 flex items-center justify-center gap-3 group"
              >
                {downloading ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Decrypting & Downloading...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Securely
                  </>
                )}
              </button>
            )}

            {mimeType !== "application/octet-stream" && (
              <p className="text-center text-gray-500 text-sm mt-6 font-mono tracking-tight">
                {mimeType}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
