
/**
 * PDF text extraction using pdf-parse ONLY (no pdfjs worker, no DOM).
 * OFFICIAL USAGE: pdf-parse expects a Buffer/TypedArray.
 * If you pass a string, it treats it as a filename and tries fs.open -> ENOENT.
 * We guard against that so it can’t happen again.
 */

function toNodeBuffer(data) {
  // Reject strings early (prevents pdf-parse from treating them as filenames)
  if (typeof data === "string") {
    throw new Error(
      'extractTextFromPdf: received STRING. Pass a PDF as Buffer/Uint8Array/ArrayBuffer, not a file path.'
    );
  }

  // Node Buffer
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(data)) return data;

  // Uint8Array -> Buffer (zero-copy view)
  if (data instanceof Uint8Array) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  }

  // ArrayBuffer -> Buffer
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data);
  }

  // Other typed array views
  if (ArrayBuffer.isView(data)) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  }

  throw new Error(
    "extractTextFromPdf: unsupported input. Provide a PDF as Buffer/Uint8Array/ArrayBuffer."
  );
}

/**
 * Parse a PDF already in memory (Buffer/Uint8Array/etc.)
 */
export async function extractTextFromPdf(input) {
  if (!input) return { text: "" };

  let buffer;
  try {
    buffer = toNodeBuffer(input); // <— will throw if a string sneaks in
  } catch (e) {
    console.error(e?.message || e);
    return { text: "" };
  }

  try {
    const pdfParse = (await import("pdf-parse")).default;
    const res = await pdfParse(buffer); // always a Buffer, never a filename
    const text = String(res?.text || "").replace(/\u0000/g, "").trim();
    return { text };
  } catch (e) {
    console.error("pdf-parse error:", e?.message || e);
    return { text: "" };
  }
}

/**
 * Convenience helper for Next.js API routes receiving a File from FormData.
 * Always returns text parsed from a Buffer (never a path).
 */
export async function extractTextFromFormDataFile(fileLike) {
  if (!fileLike || typeof fileLike !== "object" || !("arrayBuffer" in fileLike)) {
    return { text: "" };
  }
  const buf = Buffer.from(await fileLike.arrayBuffer());
  return extractTextFromPdf(buf);
}
