"use client";

import {
  FILE_UPLOAD_ACCEPTED_TYPES,
  FILE_UPLOAD_MAX_BYTES,
  type UploadedFile,
} from "@zomlab/contracts";
import { Alert } from "@zomlab/ui/components/alert";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@zomlab/ui/components/attachment";
import { Button } from "@zomlab/ui/components/button";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@zomlab/ui/components/empty-state";
import { FieldError } from "@zomlab/ui/components/field";
import { PageDescription, PageHeader, PageTitle } from "@zomlab/ui/components/page";
import { Skeleton } from "@zomlab/ui/components/skeleton";
import { Download, FileText, Trash2, Upload, X } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { useDeleteFile, useFiles, useUploadFile } from "../hooks/use-files";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function FileUploadsDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File>();
  const [selectionError, setSelectionError] = useState("");
  const files = useFiles();
  const upload = useUploadFile();
  const deleteFile = useDeleteFile();

  function selectFile(file?: File) {
    setSelectionError("");
    upload.reset();

    if (!file) {
      setSelectedFile(undefined);
      return;
    }
    if (!FILE_UPLOAD_ACCEPTED_TYPES.some((type) => type === file.type)) {
      setSelectionError("Choose a PDF, JPEG, PNG, or plain text file.");
      setSelectedFile(undefined);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > FILE_UPLOAD_MAX_BYTES) {
      setSelectionError("Choose a file that is 500 KB or smaller.");
      setSelectedFile(undefined);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size === 0) {
      setSelectionError("Choose a file that is not empty.");
      setSelectedFile(undefined);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setSelectedFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) {
      setSelectionError("Choose a file before uploading.");
      inputRef.current?.focus();
      return;
    }

    try {
      await upload.mutateAsync(selectedFile);
      setSelectedFile(undefined);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      // The mutation error remains rendered next to the form.
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader>
        <PageTitle>File Uploads</PageTitle>
        <PageDescription>
          Upload, download, and remove files from your private workspace.
        </PageDescription>
      </PageHeader>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label
          className="group flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/25 px-6 py-8 text-center transition-[background-color,border-color,box-shadow] hover:border-border-strong hover:bg-muted/45 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring"
          htmlFor="file-upload"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-background text-muted-foreground shadow-[var(--surface-shadow)] transition-colors group-hover:text-foreground">
            <Upload aria-hidden="true" className="size-5" />
          </span>
          <span className="mt-4 font-semibold text-foreground">Choose a file</span>
          <span className="mt-1 max-w-sm text-sm text-muted-foreground" id="file-upload-help">
            PDF, JPEG, PNG, or plain text up to 500 KB
          </span>
          <input
            ref={inputRef}
            accept={FILE_UPLOAD_ACCEPTED_TYPES.join(",")}
            aria-describedby="file-upload-help file-upload-error"
            aria-invalid={selectionError ? true : undefined}
            className="sr-only"
            id="file-upload"
            onChange={(event) => selectFile(event.target.files?.[0])}
            type="file"
          />
        </label>

        <div id="file-upload-error">
          {selectionError ? <FieldError>{selectionError}</FieldError> : null}
        </div>

        {selectedFile ? (
          <Attachment
            aria-label="Selected attachment"
            role="group"
            state={upload.error ? "error" : upload.isPending ? "uploading" : "idle"}
          >
            <AttachmentMedia>
              <FileText aria-hidden="true" />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{selectedFile.name}</AttachmentTitle>
              <AttachmentDescription>
                {upload.error
                  ? "Upload failed. Try again."
                  : upload.isPending
                    ? "Uploading securely…"
                    : `${selectedFile.type || "File"} · ${formatBytes(selectedFile.size)}`}
              </AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction
                aria-label={`Remove ${selectedFile.name}`}
                disabled={upload.isPending}
                onClick={() => {
                  selectFile();
                  if (inputRef.current) inputRef.current.value = "";
                }}
                type="button"
              >
                <X aria-hidden="true" />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        ) : null}

        {upload.error ? (
          <Alert variant="destructive" role="alert">
            {upload.error.message}
          </Alert>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Files are private to your account.</p>
          <Button disabled={upload.isPending} type="submit">
            <Upload aria-hidden="true" />
            {upload.isPending ? "Uploading…" : "Upload file"}
          </Button>
        </div>
        <p className="sr-only" role="status">
          {upload.isPending ? "Uploading the selected file." : ""}
        </p>
      </form>

      <section className="mt-10" aria-labelledby="uploaded-files-heading">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight" id="uploaded-files-heading">
            Uploaded files
          </h2>
          <p className="text-sm text-muted-foreground" role="status">
            {files.data ? `${files.data.total} ${files.data.total === 1 ? "file" : "files"}` : ""}
          </p>
        </div>

        {files.isLoading ? (
          <div className="space-y-3" role="status" aria-label="Loading uploaded files">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : null}

        {files.error ? (
          <Alert variant="destructive" role="alert">
            {files.error.message}
          </Alert>
        ) : null}

        {deleteFile.error ? (
          <Alert className="mb-4" variant="destructive" role="alert">
            {deleteFile.error.message}
          </Alert>
        ) : null}

        {files.data?.items.length === 0 ? (
          <EmptyState>
            <EmptyStateTitle>No files uploaded yet.</EmptyStateTitle>
            <EmptyStateDescription>
              Choose a supported file above to add the first one.
            </EmptyStateDescription>
          </EmptyState>
        ) : null}

        {files.data?.items.length ? (
          <ul className="space-y-3" aria-label="Uploaded files">
            {files.data.items.map((file: UploadedFile) => (
              <li key={file.id}>
                <Attachment aria-label={file.name} role="group" state="done">
                  <AttachmentMedia>
                    <FileText aria-hidden="true" />
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>{file.name}</AttachmentTitle>
                    <AttachmentDescription>
                      {file.type} · {formatBytes(file.size)} · Uploaded{" "}
                      {new Date(file.createdAt).toLocaleDateString()}
                    </AttachmentDescription>
                  </AttachmentContent>
                  <AttachmentActions>
                    <Button asChild size="sm" variant="outline">
                      <a href={`/api/files/${file.id}`}>
                        <Download aria-hidden="true" />
                        Download
                      </a>
                    </Button>
                    <AttachmentAction
                      aria-label={`Delete ${file.name}`}
                      disabled={deleteFile.isPending}
                      onClick={() => deleteFile.mutate(file.id)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" />
                    </AttachmentAction>
                  </AttachmentActions>
                </Attachment>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
