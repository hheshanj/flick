"use client";

import { RefObject } from "react";
import clsx from "clsx";
import { formatFileSize } from "@/lib/utils";

interface FileDropzoneProps {
  files: File[];
  isDragging: boolean;
  uploading: boolean;
  fileInputRef: RefObject<HTMLInputElement>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFiles: () => void;
}

export function FileDropzone({
  files,
  isDragging,
  uploading,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onClearFiles,
}: FileDropzoneProps) {
  return (
    <div
      className={clsx(
        "border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 mb-8 relative overflow-hidden group cursor-pointer",
        isDragging
          ? "border-orange-500 bg-orange-500/10 shadow-[0_0_30px_rgba(249,115,22,0.2)]"
          : "border-gray-300 dark:border-gray-600/50 hover:border-indigo-500/50 hover:bg-indigo-500/5",
        files.length > 0 ? "border-emerald-500/50 bg-emerald-500/5" : ""
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => files.length === 0 && !uploading && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        id="file-input"
        className="hidden"
        multiple
        onChange={onFileSelect}
        disabled={uploading}
      />
      
      {files.length > 0 ? (
        <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <svg className="w-8 h-8 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          {files.length === 1 ? (
            <>
              <p className="font-semibold text-gray-900 dark:text-white mb-1 truncate px-4 text-lg">{files[0].name}</p>
              <p className="text-sm text-emerald-400 font-medium">
                {formatFileSize(files[0].size)}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-gray-900 dark:text-white mb-1 px-4 text-lg">{files.length} Files Bundled</p>
              <p className="text-sm text-emerald-400 font-medium whitespace-nowrap mb-3 flex flex-col items-center gap-1">
                <span>Total: {formatFileSize(files.reduce((a, b) => a + b.size, 0))}</span>
              </p>
              <div className="max-h-24 overflow-y-auto w-full px-4 scrollbar-thin scrollbar-thumb-indigo-500/50 scrollbar-track-transparent">
                {files.map((f, i) => (
                  <div key={i} className="text-xs text-slate-300 truncate text-center">{f.name}</div>
                ))}
              </div>
            </>
          )}

          {!uploading && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearFiles();
              }}
              className="mt-5 text-sm text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 py-2 px-6 rounded-full transition font-medium border border-orange-500/20"
            >
              Clear Files
            </button>
          )}
        </div>
      ) : (
        <div className="relative z-10">
          <div className="w-20 h-20 bg-gray-100/80 dark:bg-gray-800/80 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner border border-black/5 dark:border-white/5 group-hover:scale-110 transition-transform duration-500">
            <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-gray-900 dark:text-white text-lg font-medium mb-2">
            Drag & Drop <span className="text-indigo-400">or Click</span>
          </p>
          <p className="text-sm text-gray-500 font-medium">Up to 1GB • Any Format</p>
        </div>
      )}
    </div>
  );
}
