"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import clsx from "clsx";

const MAX_FILE_SIZE = 1073741824;
const DURATION_OPTIONS = [5, 10, 15, 30, 60, 90, 120];
const DOWNLOAD_LIMIT_OPTIONS = [
  { label: "Unlimited", value: 0 },
  { label: "1", value: 1 },
  { label: "5", value: 5 },
  { label: "10", value: 10 },
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatExpiry(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(15);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return "File is too large. Maximum size is 1GB.";
    }
    return null;
  };

  const handleFile = useCallback((selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setError(null);
    setFile(selectedFile);
  }, []);

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
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFile(droppedFile);
      }
    },
    [handleFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFile(selectedFile);
      }
    },
    [handleFile]
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
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    return new Promise<void>((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("duration", duration.toString());
      if (password) {
        formData.append("password", password);
      }
      if (maxDownloads > 0) {
        formData.append("maxDownloads", maxDownloads.toString());
      }

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setProgress(percentComplete);
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
              fileName: file.name,
              fileSize: file.size,
              expiresAt: new Date(data.expiresAt),
              hasPassword: data.hasPassword,
              maxDownloads: data.maxDownloads,
            });
            setFile(null);
            setPassword("");
            setMaxDownloads(0);
            resolve();
          } catch {
            setError("Invalid server response");
            reject(new Error("Invalid server response"));
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            setError(data.error || "Upload failed");
          } catch {
            setError("Upload failed");
          }
          reject(new Error("Upload failed"));
        }
      });

      xhr.addEventListener("error", () => {
        setUploading(false);
        setProgress(0);
        xhrRef.current = null;
        setError("Network error during upload");
        reject(new Error("Network error"));
      });

      xhr.addEventListener("abort", () => {
        setUploading(false);
        setProgress(0);
        xhrRef.current = null;
        setError("Upload cancelled");
        reject(new Error("Upload cancelled"));
      });

      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    });
  };

  const copyToClipboard = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setShareUrl(null);
    setUploadedInfo(null);
    setError(null);
    setPassword("");
    setMaxDownloads(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    return () => {
      if (xhrRef.current) {
        xhrRef.current.abort();
      }
    };
  }, []);

  if (shareUrl) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-pink-500/10 opacity-50 z-0"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-tr from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-3 tracking-tight text-white">File Accelerated!</h1>
            <p className="text-gray-300 mb-8 font-medium">
              Vanishing gracefully on <br/> <span className="text-pink-400 font-semibold">{formatExpiry(uploadedInfo!.expiresAt)}</span>
            </p>
            
            {uploadedInfo!.hasPassword && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-amber-300 text-sm font-medium">Password protected</span>
              </div>
            )}

            {uploadedInfo!.maxDownloads && uploadedInfo!.maxDownloads > 0 && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="text-indigo-300 text-sm font-medium">Max {uploadedInfo!.maxDownloads} download{uploadedInfo!.maxDownloads === 1 ? "" : "s"}</span>
              </div>
            )}
            
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-5 mb-8 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1/2 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
              <p className="text-xs text-indigo-300 mb-2 uppercase tracking-wider font-semibold">Self-Destructing Link</p>
              <p className="font-mono text-sm break-all text-white">{shareUrl}</p>
            </div>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={copyToClipboard}
                className={clsx(
                  "w-full py-4 px-6 rounded-xl font-bold transition-all duration-300 transform hover:-translate-y-1 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] border border-indigo-500/50",
                  copied ? "bg-emerald-500 text-white border-emerald-400" : "bg-indigo-600 text-white hover:bg-indigo-500"
                )}
              >
                {copied ? "Link Copied!" : "Copy Secret Link"}
              </button>
              <button
                onClick={resetUpload}
                className="w-full bg-white/5 text-gray-300 py-4 px-6 rounded-xl font-medium hover:bg-white/10 transition border border-transparent hover:border-white/10"
              >
                Share Another File
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-10">
          <div className="inline-block px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 mb-6 text-sm font-medium text-indigo-300">
            Ephemeral • Secure • Instant
          </div>
          <h1 className="text-6xl font-extrabold mb-4 tracking-tighter sm:text-7xl gradient-text drop-shadow-sm">Flick</h1>
          <p className="text-lg text-gray-400 font-medium">
            An encrypted, auto-destructing temp file share web app.
          </p>
        </div>

        <div className="glass rounded-3xl p-8 shadow-2xl relative">
          <div
            className={clsx(
              "border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 mb-8 relative overflow-hidden group cursor-pointer",
              isDragging
                ? "border-pink-500 bg-pink-500/10 shadow-[0_0_30px_rgba(236,72,153,0.2)]"
                : "border-gray-600/50 hover:border-indigo-500/50 hover:bg-indigo-500/5",
              file ? "border-emerald-500/50 bg-emerald-500/5" : ""
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !file && !uploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              id="file-input"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            
            {file ? (
              <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
                <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="font-semibold text-white mb-1 truncate px-4 text-lg">{file.name}</p>
                <p className="text-sm text-emerald-400 font-medium">
                  {formatFileSize(file.size)}
                </p>
                {!uploading && (
                  <button
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="mt-5 text-sm text-pink-400 hover:text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 py-2 px-6 rounded-full transition font-medium border border-pink-500/20"
                  >
                    Discard File
                  </button>
                )}
              </div>
            ) : (
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gray-800/80 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner border border-white/5 group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-white text-lg font-medium mb-2">
                  Drag & Drop <span className="text-indigo-400">or Click</span>
                </p>
                <p className="text-sm text-gray-500 font-medium">Up to 1GB • Any Format</p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {file && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
                  Self-Destruct Timer
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {DURATION_OPTIONS.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDuration(mins)}
                      className={clsx(
                        "py-3 px-2 rounded-xl text-sm font-bold transition-all duration-200 border",
                        duration === mins
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                          : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:border-white/20"
                      )}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
                  Password Protection
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Optional password"
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
              </div>

              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
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
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                          : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:border-white/20"
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
                    <span className="text-gray-400">Uploading...</span>
                    <span className="text-indigo-400 font-medium">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={uploading ? handleCancelUpload : handleUpload}
                disabled={!file || (!uploading && (file.size > MAX_FILE_SIZE))}
                className={clsx(
                  "w-full py-4 px-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] border border-white/10 group relative overflow-hidden",
                  uploading
                    ? "bg-red-600 hover:bg-red-500"
                    : "bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                {!uploading && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0 rounded-2xl"></div>}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
