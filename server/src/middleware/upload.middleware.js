/**
 * Multipart Form-Data Parser Middleware
 * Parses multipart/form-data for image uploads without external libraries like multer.
 * Populates req.file = { buffer, mimetype, size, originalname, fieldname }
 */

export const parseMultipartImage = (fieldName = "profilePic") => {
  return (req, res, next) => {
    const contentType = req.headers["content-type"] || "";

    // If request is JSON (e.g. data URL or URL string passed in body), let express.json() handle it
    if (!contentType.includes("multipart/form-data")) {
      return next();
    }

    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!boundaryMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid multipart payload: missing boundary",
      });
    }

    const boundary = boundaryMatch[1] || boundaryMatch[2];
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const chunks = [];

    req.on("data", (chunk) => {
      chunks.push(chunk);
    });

    req.on("end", () => {
      try {
        const fullBuffer = Buffer.concat(chunks);
        const file = extractFileFromMultipart(fullBuffer, boundaryBuffer, fieldName);

        if (file) {
          req.file = file;
        }

        next();
      } catch (err) {
        console.error("Multipart parse error:", err);
        return res.status(400).json({
          success: false,
          message: "Failed to parse uploaded file",
        });
      }
    });

    req.on("error", (err) => {
      next(err);
    });
  };
};

function extractFileFromMultipart(buffer, boundaryBuffer, targetField) {
  let startIndex = 0;

  while (startIndex < buffer.length) {
    const nextBoundary = buffer.indexOf(boundaryBuffer, startIndex);
    if (nextBoundary === -1) break;

    const partStart = nextBoundary + boundaryBuffer.length;
    const headerEnd = buffer.indexOf(Buffer.from("\r\n\r\n"), partStart);
    if (headerEnd === -1) break;

    const headerStr = buffer.slice(partStart, headerEnd).toString("utf-8");
    const nameMatch = headerStr.match(/name="([^"]+)"/);
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    const contentTypeMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);

    const nextBoundaryAfterPart = buffer.indexOf(boundaryBuffer, headerEnd + 4);
    if (nextBoundaryAfterPart === -1) break;

    // Remove preceding \r\n before the next boundary
    let partDataEnd = nextBoundaryAfterPart;
    if (
      buffer[partDataEnd - 2] === 0x0d && // \r
      buffer[partDataEnd - 1] === 0x0a // \n
    ) {
      partDataEnd -= 2;
    }

    const partData = buffer.slice(headerEnd + 4, partDataEnd);

    if (
      nameMatch &&
      (nameMatch[1] === targetField ||
        nameMatch[1] === "profilePic" ||
        nameMatch[1] === "profilePicture" ||
        nameMatch[1] === "avatar" ||
        nameMatch[1] === "file")
    ) {
      return {
        fieldname: nameMatch[1],
        originalname: filenameMatch ? filenameMatch[1] : "uploaded_image",
        mimetype: contentTypeMatch ? contentTypeMatch[1].trim() : "image/jpeg",
        buffer: partData,
        size: partData.length,
      };
    }

    startIndex = nextBoundaryAfterPart;
  }

  return null;
}
