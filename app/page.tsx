"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import clsx from "clsx";
import { SuccessView } from "./components/SuccessView";
import { FileDropzone } from "./components/FileDropzone";

const MAX_FILE_SIZE = 1073741824; // 1GB
const DURATION_OPTIONS = [5, 10, 15, 30, 60, 90, 120];
const DOWNLOAD_LIMIT_OPTIONS = [
  { label: "Unlimited", value: 0 },
  { label: "1", value: 1 },
  { label: "5", value: 5 },
  { label: "10", value: 10 },
];

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [duration, setDuration] = useState<number | "custom">(15);
  const [customMinutes, setCustomMinutes] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [uploadedInfo, setUploadedInfo] = useState<{
    fileName: string;
    fileSize: number;
    expiresAt: Date;
    hasPassword: boolean;
    maxDownloads: number | null;
  } | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [maxDownloads, setMaxDownloads] = useState(0);
  const [uniqueIpLimit, setUniqueIpLimit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const validateFiles = (incomingFiles: File[]): string | null => {
    const totalSize = incomingFiles.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > MAX_FILE_SIZE) {
      return "Total files size is too large. Maximum size is 1GB.";
    }
    return null;
  };

  const handleFiles = useCallback((selectedFiles: FileList | File[]) => {
    const newFiles = Array.from(selectedFiles);
    const combinedFiles = [...files, ...newFiles];
    
    const validationError = validateFiles(combinedFiles);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setFiles(combinedFiles);
  }, [files]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
      e.target.value = ""; // allow re-selecting same file
    },
    [handleFiles]
  );

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setUploading(false);
    setProgress(0);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    let computedDuration = 15;
    if (duration === "custom") {
      if (!customMinutes) {
        setError("Please specify custom minutes.");
        return;
      }
      computedDuration = parseInt(customMinutes, 10);
      if (isNaN(computedDuration) || computedDuration <= 0) {
        setError("Custom minutes must be a positive number.");
        return;
      }
    } else {
      computedDuration = duration;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    return new Promise<void>((resolve, reject) => {
      const formData = new FormData();
      files.forEach((f) => formData.append("file", f));
      formData.append("duration", computedDuration.toString());
      if (password) formData.append("password", password);
      if (maxDownloads > 0) formData.append("maxDownloads", maxDownloads.toString());
      formData.append("uniqueIpLimit", uniqueIpLimit.toString());

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        setUploading(false);
        setProgress(0);
        xhrRef.current = null;

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            setShareUrl(data.shareUrl);
            setUploadedInfo({
              fileName: files.length > 1 ? "flick-bundle.zip" : files[0].name,
              fileSize: files.reduce((acc, f) => acc + f.size, 0),
              expiresAt: new Date(data.expiresAt),
              hasPassword: data.hasPassword,
              maxDownloads: data.maxDownloads,
            });
            setFiles([]);
          } catch {
            setError("Invalid server response");
            reject();
          }
          resolve();
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            setError(data.error || "Upload failed");
          } catch {
            setError("Upload failed");
          }
          reject();
        }
      });

      xhr.addEventListener("error", () => {
        setUploading(false);
        setError("Network error");
        reject();
      });

      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    });
  };

  const resetUpload = () => {
    setFiles([]);
    setShareUrl(null);
    setUploadedInfo(null);
    setError(null);
    setPassword("");
    setDuration(15);
    setCustomMinutes("");
    setMaxDownloads(0);
    setUniqueIpLimit(false);
  };

  useEffect(() => {
    return () => xhrRef.current?.abort();
  }, []);

  if (shareUrl && uploadedInfo) {
    return <SuccessView shareUrl={shareUrl} uploadedInfo={uploadedInfo} onReset={resetUpload} />;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="inline-block px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 mb-6 text-sm font-medium text-indigo-600 dark:text-indigo-300">
            Ephemeral • Secure • Instant
          </div>
          <div className="flex items-center justify-center gap-4 mb-4">
            <img src="/logo.svg" alt="Flick Logo" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            <h1 className="text-6xl font-extrabold tracking-tighter sm:text-7xl gradient-text drop-shadow-sm">Flick</h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            An encrypted, auto-destructing temp file share web app.
          </p>
        </div>

        <div className="glass rounded-3xl p-8 shadow-2xl relative">
          <FileDropzone 
            files={files}
            isDragging={isDragging}
            uploading={uploading}
            fileInputRef={fileInputRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onFileSelect={handleFileSelect}
            onClearFiles={() => setFiles([])}
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {files.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">
                  Self-Destruct Timer
                </label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {DURATION_OPTIONS.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDuration(mins)}
                      className={clsx(
                        "py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 border",
                        duration === mins
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-gray-900 dark:text-white border-transparent shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                          : "bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10"
                      )}
                    >
                      {mins}m
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setDuration("custom")}
                    className={clsx(
                      "py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 border",
                      duration === "custom"
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-gray-900 dark:text-white border-transparent shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                        : "bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10"
                    )}
                  >
                    Custom...
                  </button>
                </div>
                
                {duration === "custom" && (
                   <div className="animate-in fade-in slide-in-from-top-2">
                     <input
                       type="number"
                       value={customMinutes}
                       onChange={(e) => setCustomMinutes(e.target.value)}
                       min="1"
                       placeholder="Enter minutes (e.g. 120)"
                       className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-3 px-4 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                     />
                   </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">
                  Password Protection
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Optional password"
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-3 px-4 pr-12 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-300 transition"
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
              </div>

              <div className="mb-6">
                <label className="flex items-center space-x-3 cursor-pointer group bg-black/20 p-4 rounded-xl border border-black/5 dark:border-white/5 hover:border-indigo-500/30 transition-all">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      className="peer appearance-none w-6 h-6 border-2 border-indigo-500/50 rounded bg-transparent checked:bg-indigo-500 transition-all cursor-pointer shadow-inner" 
                      checked={uniqueIpLimit} 
                      onChange={(e) => setUniqueIpLimit(e.target.checked)}
                    />
                    <svg className="absolute w-4 h-4 text-gray-900 dark:text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-200 group-hover:text-indigo-600 dark:text-indigo-300 transition-colors uppercase tracking-wider">Strict Security Mode</span>
                    <span className="text-xs text-gray-500 font-medium">Limit to 1 download per unique IP Address.</span>
                  </div>
                </label>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">
                  Download Limit
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {DOWNLOAD_LIMIT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMaxDownloads(opt.value)}
                      className={clsx(
                        "py-3 px-2 rounded-xl text-sm font-bold transition-all duration-200 border",
                        maxDownloads === opt.value
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-gray-900 dark:text-white border-transparent shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                          : "bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {uploading && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Uploading...</span>
                    <span className="text-indigo-400 font-medium">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-orange-500 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={uploading ? handleCancelUpload : handleUpload}
                disabled={files.length === 0}
                className={clsx(
                  "w-full py-4 px-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] border border-black/10 dark:border-white/10 group relative overflow-hidden",
                  uploading
                    ? "bg-red-600 hover:bg-red-500"
                    : "bg-gradient-to-r from-indigo-600 to-orange-600 hover:from-indigo-500 hover:to-orange-500 disabled:opacity-50"
                )}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cancel Upload
                  </span>
                ) : (
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Encrypt & Share
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
