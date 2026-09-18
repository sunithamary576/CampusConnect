import React from "react";

function getFileType(fileName) {
  const ext =
    fileName?.split(".").pop()?.toLowerCase() || "";

  if (
    ["png", "jpg", "jpeg", "gif", "webp"].includes(ext)
  ) {
    return "image";
  }

  if (ext === "pdf") {
    return "pdf";
  }

  if (
    ["doc", "docx", "txt", "rtf"].includes(ext)
  ) {
    return "doc";
  }

  return "file";
}

export default function FilePreview({
  fileData,
  fileName,
}) {
  if (!fileData) return null;

  const type = getFileType(fileName || "file");

  return (
    <div
      className="card mt-3 border"
      style={{
        maxWidth: "400px",
      }}
    >
      <div className="card-body">

        {/* IMAGE PREVIEW */}

        {type === "image" ? (
          <img
            src={fileData}
            alt={fileName || "attachment"}
            className="rounded mb-3"
            style={{
              display: "block",
              width: "auto",
              maxWidth: "350px",
              height: "auto",
              maxHeight: "200px",
              objectFit: "contain",
            }}
          />
        ) : (
          /* OTHER FILES */

          <div
            className="p-4 text-center bg-light rounded mb-3"
          >
            <div
              className="fw-bold"
              style={{ fontSize: "24px" }}
            >
              📎
            </div>

            <div className="fw-semibold">
              {type.toUpperCase()}
            </div>
          </div>
        )}

        {/* FILE INFORMATION */}

        <div className="mb-2">
          <div className="fw-semibold">
            {fileName || "Attachment"}
          </div>

          <small className="text-muted">
            {type.toUpperCase()} file
          </small>
        </div>

        {/* BUTTONS */}

        <div className="d-flex gap-2">
          <a
            href={fileData}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-primary btn-sm"
          >
            Open
          </a>

          <a
            href={fileData}
            download={fileName}
            className="btn btn-outline-secondary btn-sm"
          >
            Download
          </a>
        </div>

      </div>
    </div>
  );
}