"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Eye, FileText, FlaskConical, LoaderCircle, RefreshCw, UploadCloud } from "lucide-react";
import { analyzeResume } from "@/services/recruiter";
import type { RecruiterAnalysis } from "@/types/recruiter";

type ResumeUploaderProps = {
  onAnalyzed: (analysis: RecruiterAnalysis) => void;
  onError: (message: string) => void;
  onUseDemo: () => void;
};

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export default function ResumeUploader({ onAnalyzed, onError, onUseDemo }: ResumeUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const processFile = async (file?: File) => {
    if (!file || uploading) return;

    const validationError = validateResume(file);
    if (validationError) {
      setErrorMessage(validationError);
      onError(validationError);
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setLastFile(file);
    setFileName(file.name);
    setPreviewOpen(false);
    setErrorMessage(null);
    setCompleted(false);
    setUploading(true);
    setProgress(0);

    try {
      const analysis = await analyzeResume(file, { onProgress: setProgress });
      setProgress(100);
      setCompleted(true);
      onAnalyzed(analysis);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to analyze this resume.";
      setErrorMessage(message);
      onError(message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-bold">Resume review</p>
          <p className="mt-1 text-xs text-slate-500">Upload a PDF and let the Recruiter prepare a structured review.</p>
        </div>
        {uploading && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600">
            <LoaderCircle size={14} className="animate-spin" /> Analyzing
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        onChange={(event) => processFile(event.target.files?.[0])}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        aria-label="Upload PDF resume"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!uploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void processFile(event.dataTransfer.files[0]);
        }}
        disabled={uploading}
        className={`mt-5 flex min-h-36 w-full flex-col items-center justify-center rounded-xl border border-dashed p-5 text-center transition ${
          dragging
            ? "border-indigo-400 bg-indigo-50"
            : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50"
        } disabled:cursor-wait disabled:opacity-80`}
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-indigo-600 shadow-sm">
          {uploading ? <LoaderCircle size={19} className="animate-spin" /> : <UploadCloud size={19} />}
        </span>
        <p className="mt-3 text-xs font-bold text-slate-700">Drop a PDF resume here or click to browse</p>
        <p className="mt-1 text-[10px] text-slate-400">PDF files only · maximum file size 5 MB</p>
      </button>

      {fileName && (
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="shrink-0 text-rose-500" />
            <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">{fileName}</p>
          </div>
          {uploading && (
            <div className="mt-3">
              <div
                role="progressbar"
                aria-label="Resume analysis progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                className="h-1.5 overflow-hidden rounded-full bg-slate-200"
              >
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-slate-500">Uploading and analyzing resume · {progress}%</p>
            </div>
          )}
          {completed && !uploading && (
            <p className="mt-2 text-[10px] font-medium text-emerald-600">Analysis completed successfully.</p>
          )}
          {previewUrl && (
            <button
              type="button"
              onClick={() => setPreviewOpen((current) => !current)}
              aria-expanded={previewOpen}
              className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
            >
              <Eye size={12} /> {previewOpen ? "Hide resume preview" : "Preview resume"}
            </button>
          )}
        </div>
      )}

      {previewOpen && previewUrl && (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <iframe
            src={previewUrl}
            title={`Preview of ${fileName ?? "uploaded resume"}`}
            className="h-72 w-full bg-white"
          />
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="mt-4 flex flex-col gap-3 rounded-xl border border-rose-100 bg-rose-50 p-3 sm:flex-row sm:items-center"
        >
          <div className="flex min-w-0 flex-1 gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
            <p className="text-xs leading-5 text-rose-700">{errorMessage}</p>
          </div>
          {lastFile && (
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => void processFile(lastFile)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[10px] font-bold text-rose-700 shadow-sm transition hover:bg-rose-100"
              >
                <RefreshCw size={12} /> Try again
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  onUseDemo();
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                <FlaskConical size={12} /> Use demo result
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function validateResume(file: File) {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return "Please upload a PDF resume.";
  }
  if (file.size === 0) return "The uploaded resume is empty.";
  if (file.size > MAX_RESUME_BYTES) return "Resume files must be 5 MB or smaller.";
  return null;
}
