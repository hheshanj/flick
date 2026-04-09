"use client";

import { useState } from "react";
import clsx from "clsx";
import QRCode from "react-qr-code";
import { formatExpiry } from "@/lib/utils";

interface SuccessViewProps {
  shareUrl: string;
  uploadedInfo: {
    expiresAt: Date;
    hasPassword: boolean;
    maxDownloads: number | null;
  };
  onReset: () => void;
}

export function SuccessView({ shareUrl, uploadedInfo, onReset }: SuccessViewProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-orange-500/10 opacity-50 z-0"></div>
        <div className="relative z-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <svg className="w-10 h-10 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight text-gray-900 dark:text-white">File Accelerated!</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-8 font-medium">
            Vanishing gracefully on <br/> <span className="text-orange-400 font-semibold">{formatExpiry(uploadedInfo.expiresAt)}</span>
          </p>
          
          {uploadedInfo.hasPassword && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-amber-300 text-sm font-medium">Password protected</span>
            </div>
          )}

          {uploadedInfo.maxDownloads && uploadedInfo.maxDownloads > 0 && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="text-indigo-600 dark:text-indigo-300 text-sm font-medium">Max {uploadedInfo.maxDownloads} download{uploadedInfo.maxDownloads === 1 ? "" : "s"}</span>
            </div>
          )}
          
          <div className="bg-white/70 dark:bg-black/40 backdrop-blur-md rounded-2xl p-6 mb-8 border border-black/5 dark:border-white/5 relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 left-0 w-1/2 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
            
            <div className="bg-white p-3 rounded-2xl mb-5 shadow-xl">
              <QRCode value={shareUrl} size={150} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
            </div>

            <p className="text-xs text-indigo-600 dark:text-indigo-300 mb-2 uppercase tracking-wider font-semibold">Self-Destructing Link</p>
            <p className="font-mono text-sm break-all text-gray-900 dark:text-white w-full">{shareUrl}</p>
          </div>
          
          <div className="flex flex-col gap-4">
            <button
              onClick={copyToClipboard}
              className={clsx(
                "w-full py-4 px-6 rounded-xl font-bold transition-all duration-300 transform hover:-translate-y-1 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] border border-indigo-500/50",
                copied ? "bg-emerald-500 text-gray-900 dark:text-white border-emerald-400" : "bg-indigo-600 text-gray-900 dark:text-white hover:bg-indigo-500"
              )}
            >
              {copied ? "Link Copied!" : "Copy Secret Link"}
            </button>
            <button
              onClick={onReset}
              className="w-full bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 py-4 px-6 rounded-xl font-medium hover:bg-black/10 dark:hover:bg-white/10 transition border border-transparent hover:border-black/10 dark:border-white/10"
            >
              Share Another File
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
