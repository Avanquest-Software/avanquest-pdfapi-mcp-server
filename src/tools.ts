/**
 * MCP tool definitions and Zod schemas for Avanquest PDF API
 */

import { z } from "zod";

// Zod schema for PDF to Word conversion
export const PdfConvertToWordSchema = z.object({
  filePath: z.string().describe("Path to the PDF file to convert to Word"),
  outputPath: z.string().describe("Path where the converted Word document should be saved"),
  password: z
    .string()
    .optional()
    .describe("Password to open the PDF file (if password-protected)"),
  pages: z
    .string()
    .optional()
    .describe(
      "Pages to convert. Specify page numbers separated by commas (e.g., '1,3,5') or ranges with " +
      "dashes (e.g., '3-7'). Leave empty to convert all pages"
    ),
});

// Zod schema for PDF to PowerPoint conversion
export const PdfConvertToPowerPointSchema = z.object({
  filePath: z.string().describe("Path to the PDF file to convert to PowerPoint"),
  outputPath: z.string().describe("Path where the converted PowerPoint presentation should be saved"),
  password: z
    .string()
    .optional()
    .describe("Password to open the PDF file (if password-protected)"),
  pages: z
    .string()
    .optional()
    .describe(
      "Pages to convert. Specify page numbers separated by commas (e.g., '1,3,5') or ranges with " +
      "dashes (e.g., '3-7'). Leave empty to convert all pages"
    ),
});

// Zod schema for PDF to Excel conversion
export const PdfConvertToExcelSchema = z.object({
  filePath: z.string().describe("Path to the PDF file to convert to Excel"),
  outputPath: z.string().describe("Path where the converted Excel workbook should be saved"),
  password: z
    .string()
    .optional()
    .describe("Password to open the PDF file (if password-protected)"),
  pages: z
    .string()
    .optional()
    .describe(
      "Pages to convert. Specify page numbers separated by commas (e.g., '1,3,5') or ranges with " +
      "dashes (e.g., '3-7'). Leave empty to convert all pages"
    ),
  convertPdfToExcelType: z
    .enum(["tablePerSheet", "pagePerSheet", "documentPerSheet"])
    .optional()
    .describe(
      "Excel conversion mode: 'tablePerSheet' places each table on separate sheets, 'pagePerSheet' " +
      "places each page on separate sheets, 'documentPerSheet' places entire document on one sheet. " +
      "Default is tablePerSheet"
    ),
  keepTablesOnly: z
    .boolean()
    .optional()
    .describe(
      "Keep only tables when converting to Excel. Default is false"
    ),
});

// Zod schema for PDF Merge tool
export const PdfMergeSchema = z.object({
  outputPath: z.string().describe("Path where the merged PDF should be saved"),
  files: z
    .array(
      z.object({
        filePath: z.string().describe("Path to the PDF file to merge"),
        password: z
          .string()
          .optional()
          .describe("Password to open this PDF file (if password-protected)"),
        pages: z
          .string()
          .optional()
          .describe(
            "Pages to include from this file. Specify page numbers separated by commas (e.g., '1,3,5') " +
            "or ranges with dashes (e.g., '3-7'). Leave empty to include all pages"
          ),
      })
    )
    .min(2)
    .describe("Array of PDF files to merge (minimum 2 files required)"),
});

// Zod schema for PDF Compress tool
export const PdfCompressSchema = z.object({
  filePath: z.string().describe("Path to the PDF file to compress"),
  outputPath: z.string().describe("Path where the compressed PDF should be saved"),
  password: z
    .string()
    .optional()
    .describe("Password to open the PDF file (if password-protected)"),
  pages: z
    .string()
    .optional()
    .describe(
      "Pages to compress. Specify page numbers separated by commas (e.g., '1,3,5') or ranges with " +
      "dashes (e.g., '3-7'). Leave empty to compress all pages"
    ),
  quality: z
    .enum(["min", "low", "medium", "high", "max"])
    .optional()
    .describe(
      "Compression quality level: 'min' for maximum compression, 'max' for best quality. Default is 'min'"
    ),
});

// Zod schema for PDF Split tool
export const PdfSplitSchema = z.object({
  filePath: z.string().describe("Path to the PDF file to split"),
  outputPath: z.string().describe("Path where the ZIP archive with split PDFs should be saved"),
  password: z
    .string()
    .optional()
    .describe("Password to open the PDF file (if password-protected)"),
  pages: z
    .string()
    .optional()
    .describe(
      "Pages to split. Specify page numbers separated by commas (e.g., '1,3,5') or ranges with " +
      "dashes (e.g., '3-7'). Leave empty to split each page into a separate file"
    ),
  labelStart: z
    .number()
    .int()
    .optional()
    .describe(
      "Starting number for labeling output files. Files will be named '{originalName}.pdf - " +
      "{labelNumber}'. Default is 0"
    ),
});

// Zod schema for PDF to Text tool
export const PdfToTextSchema = z.object({
  filePath: z.string().describe("Path to the PDF file to convert to text"),
  outputPath: z.string().describe("Path where the text file should be saved"),
  password: z
    .string()
    .optional()
    .describe("Password to open the PDF file (if password-protected)"),
  pages: z
    .string()
    .optional()
    .describe(
      "Pages to convert. Specify page numbers separated by commas (e.g., '1,3,5') or ranges with " +
      "dashes (e.g., '3-7'). Leave empty to convert all pages"
    ),
  divider: z
    .string()
    .optional()
    .describe(
      "Page divider to insert between pages. Can be a custom string (e.g., '---') or format string " +
      "like '%1%' for page numbers, '%1% of %2%' for 'page X of total' format"
    ),
  convertCropped: z
    .boolean()
    .optional()
    .describe(
      "Include text that falls outside page bounds in the output. Default is false"
    ),
});

// Zod schema for Delete PDF Pages tool
export const DeletePdfPagesSchema = z.object({
  filePath: z.string().describe("Path to the PDF file"),
  outputPath: z.string().describe("Path where the modified PDF should be saved"),
  pages: z
    .string()
    .describe(
      "Pages to delete. Specify page numbers separated by commas (e.g., '1,3,5') or ranges with dashes (e.g., '3-7')"
    ),
  password: z
    .string()
    .optional()
    .describe("Password to open the PDF file (if password-protected)"),
});

// Zod schema for Rotate PDF tool
export const RotatePdfSchema = z.object({
  filePath: z.string().describe("Path to the PDF file to rotate"),
  outputPath: z.string().describe("Path where the rotated PDF should be saved"),
  password: z
    .string()
    .optional()
    .describe("Password to open the PDF file (if password-protected)"),
  pages: z
    .string()
    .optional()
    .describe(
      "Pages to rotate. Specify page numbers separated by commas (e.g., '1,3,5') or ranges with " +
      "dashes (e.g., '3-7'). Leave empty to rotate all pages"
    ),
  rotateDegrees: z
    .enum(["90", "180", "270"])
    .optional()
    .describe(
      "Clockwise rotation angle in degrees: '90', '180', or '270'. Default is '90'"
    ),
});

// Zod schema for HTML to PDF tool
export const HtmlToPdfSchema = z.object({
  filePath: z
    .string()
    .optional()
    .describe("Path to the HTML file to convert to PDF. Either filePath or url must be provided"),
  url: z
    .string()
    .url()
    .refine((u) => /^https?:\/\//i.test(u), { message: "URL must use http or https scheme" })
    .optional()
    .describe("URL of the HTML content to convert to PDF (http/https only). Either filePath or url must be provided"),
  outputPath: z.string().describe("Path where the converted PDF should be saved"),
  format: z
    .enum([
      "singlePage",
      "letter",
      "legal",
      "tabloid",
      "ledger",
      "a0",
      "a1",
      "a2",
      "a3",
      "a4",
      "a5",
      "a6",
    ])
    .optional()
    .describe(
      "Format of the PDF document. Available formats: singlePage, letter, legal, tabloid, ledger, " +
      "a0, a1, a2, a3, a4, a5, a6. Default is singlePage"
    ),
});

// Zod schema for Image to PDF tool
export const ImgToPdfSchema = z.object({
  imagePath: z
    .string()
    .describe("Path to the image file to convert to PDF. Supported formats: jpeg, jpg, bmp, png, gif"),
  outputPath: z.string().describe("Path where the converted PDF should be saved"),
});

// Zod schema for Text to PDF tool
export const TxtToPdfSchema = z.object({
  filePath: z.string().describe("Path to the text file (.txt) to convert to PDF"),
  outputPath: z.string().describe("Path where the converted PDF should be saved"),
});

// Zod schema for Password Protect PDF tool
export const PasswordProtectPdfSchema = z.object({
  filePath: z.string().describe("Path to the PDF file to password protect"),
  outputPath: z.string().describe("Path where the password-protected PDF should be saved"),
  password: z
    .string()
    .optional()
    .describe("Current password to open the PDF file (if already password-protected)"),
  newPassword: z
    .string()
    .describe("New password to set for opening the PDF file"),
});

// Zod schema for Unlock PDF tool
export const UnlockPdfSchema = z.object({
  filePath: z.string().describe("Path to the password-protected PDF file to unlock"),
  outputPath: z.string().describe("Path where the unlocked PDF should be saved"),
  password: z
    .string()
    .describe("Password to open and unlock the PDF file"),
});

// Zod schema for Resize PDF tool
export const ResizePdfSchema = z.object({
  filePath: z.string().describe("Path to the PDF file to resize"),
  outputPath: z.string().describe("Path where the resized PDF should be saved"),
  password: z
    .string()
    .optional()
    .describe("Password to open the PDF file (if password-protected)"),
  pages: z
    .string()
    .optional()
    .describe(
      "Pages to resize. Specify page numbers separated by commas (e.g., '1,3,5') or ranges with " +
      "dashes (e.g., '3-7'). Leave empty to resize all pages"
    ),
  width: z
    .number()
    .min(0.1)
    .max(200)
    .optional()
    .describe(
      "Width in inches. Must be between 0.1 and 200 inches. Default is 8.3 inches"
    ),
  height: z
    .number()
    .min(0.1)
    .max(200)
    .optional()
    .describe(
      "Height in inches. Must be between 0.1 and 200 inches. Default is 11.7 inches"
    ),
});

// Zod schema for PDF to JSON tool
export const PdfToJsonSchema = z.object({
  filePath: z.string().describe("Path to the PDF file to convert to JSON"),
  outputPath: z.string().describe("Path where the JSON file should be saved"),
  password: z
    .string()
    .optional()
    .describe("Password to open the PDF file (if password-protected)"),
  pages: z
    .string()
    .optional()
    .describe(
      "Pages to convert. Specify page numbers separated by commas (e.g., '1,3,5') or ranges with " +
      "dashes (e.g., '3-7'). Leave empty to convert all pages"
    ),
});

// Zod schema for Add Watermark to PDF tool
export const AddWatermarkToPdfSchema = z.object({
  filePath: z.string().describe("Path to the PDF file to add watermark to"),
  outputPath: z.string().describe("Path where the watermarked PDF should be saved"),
  password: z
    .string()
    .optional()
    .describe("Password to open the PDF file (if password-protected)"),
  pages: z
    .string()
    .optional()
    .describe(
      "Pages to add watermark to. Specify page numbers separated by commas (e.g., '1,3,5') or ranges " +
      "with dashes (e.g., '3-7'). Leave empty to add watermark to all pages"
    ),
  text: z
    .string()
    .optional()
    .describe("Watermark text to apply. Either text or sourceFilePath must be provided"),
  fontFamily: z
    .string()
    .optional()
    .describe("Font family for watermark text. Default: Times New Roman"),
  fontSize: z
    .number()
    .int()
    .optional()
    .describe("Font size for watermark text. Default: 42"),
  fontColor: z
    .string()
    .optional()
    .describe("Font color for watermark text in hex format (e.g., #FF000000). Default: #FF000000"),
  bold: z
    .boolean()
    .optional()
    .describe("Make watermark text bold. Default: false"),
  italic: z
    .boolean()
    .optional()
    .describe("Make watermark text italic. Default: false"),
  sourceFilePath: z
    .string()
    .optional()
    .describe(
      "Path to source file to use as watermark (PDF, JPG, JPEG, BMP, PNG, GIF, WWF, TIF, TIFF). " +
      "Either text or sourceFilePath must be provided"
    ),
  sourceFilePassword: z
    .string()
    .optional()
    .describe("Password to open source PDF file (if password-protected)"),
  sourceFilePageNumber: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Page number of source PDF to use as watermark. Pages start from 1. Default: 1"),
  sourceFileScale: z
    .number()
    .min(1)
    .max(500)
    .optional()
    .describe("Scale of source file watermark (1-500 percent). Default: 100"),
  rotation: z
    .enum(["0", "45", "90", "270", "315"])
    .optional()
    .describe(
      "Counterclockwise rotation of watermark in degrees. Options: 0, 45, 90, 270, 315. Default: 0"
    ),
  opacity: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("Opacity of watermark (0-1, where 0 is transparent, 1 is opaque). Default: 1"),
  position: z
    .enum([
      "top",
      "rightTop",
      "right",
      "rightBottom",
      "bottom",
      "leftBottom",
      "left",
      "leftTop",
      "count",
      "center",
    ])
    .optional()
    .describe("Position of watermark on page. Default: center"),
  isBehind: z
    .boolean()
    .optional()
    .describe(
      "Place watermark behind page content (true) or above it (false). Default: false"
    ),
});

// Zod schema for Document Extract tool
export const DocumentExtractSchema = z.object({
  filePath: z
    .string()
    .describe(
      "Path to the file to extract data from. Supported formats: pdf, jpg, jpeg, png, tiff, tif, bmp, gif, heic, webp. " +
      "Maximum file size: 100MB"
    ),
  outputPath: z
    .string()
    .describe("Path where the extracted Markdown document should be saved (.md)"),
  password: z
    .string()
    .optional()
    .describe("Password to open the PDF file (if password-protected)"),
  pages: z
    .string()
    .optional()
    .describe(
      "Pages to process. Specify page numbers separated by commas (e.g., '1,3,5') or ranges with " +
      "dashes (e.g., '3-7'). Leave empty to process all pages"
    ),
});

// Zod schema for OCR tool
export const OcrPdfSchema = z.object({
  filePath: z
    .string()
    .describe(
      "Path to the file to perform OCR on. Supported formats: pdf, jpg, jpeg, png, tiff, tif, bmp, gif, heic, webp. " +
      "Maximum file size: 100MB"
    ),
  outputPath: z
    .string()
    .describe("Path where the OCR result PDF should be saved (.pdf)"),
  password: z
    .string()
    .optional()
    .describe("Password to open the PDF file (if password-protected)"),
  pages: z
    .string()
    .optional()
    .describe(
      "Pages to process. Specify page numbers separated by commas (e.g., '1,3,5') or ranges with " +
      "dashes (e.g., '3-7'). Leave empty to process all pages"
    ),
  deskew: z
    .boolean()
    .optional()
    .describe("Apply deskew correction to the image before OCR. Default is false"),
});

// Zod schema for PDF Insight tool
export const PdfInsightSchema = z.object({
  filePath: z.string().describe("Path to the PDF file to analyze. Supported format: pdf. Maximum file size: 100MB"),
  outputPath: z.string().describe("Path where the extracted insights JSON file should be saved (.json)"),
  password: z
    .string()
    .optional()
    .describe("Password to open the PDF file (if password-protected)"),
  pages: z
    .string()
    .optional()
    .describe(
      "Pages to process. Specify page numbers separated by commas (e.g., '1,3,5') or ranges with " +
      "dashes (e.g., '3-7'). Leave empty to process all pages"
    ),
  modelType: z
    .enum(["external", "internal"])
    .optional()
    .describe("AI model type to use: 'external' or 'internal'. Default is 'internal'"),
});

// Zod schema for PDF Analyze Tag tool
export const PdfAnalyzeTagSchema = z.object({
  filePath: z.string().describe("Path to the PDF file to analyze"),
  password: z
    .string()
    .optional()
    .describe("Password to open the PDF file (if password-protected)"),
  pages: z
    .string()
    .optional()
    .describe(
      "Pages to analyze. Specify page numbers separated by commas (e.g., '1,3,5') or ranges with " +
      "dashes (e.g., '3-7'). Leave empty to analyze all pages"
    ),
});

// Zod schema for Sign PDF tool (v2)
export const SignPdfSchema = z.object({
  filePath: z.string().describe("Path to the PDF file to sign. Supported format: pdf. Maximum file size: 100MB"),
  outputPath: z.string().describe("Path where the signed PDF should be saved (.pdf)"),
  password: z
    .string()
    .optional()
    .describe("Password to open/authenticate the PDF file (if password-protected)"),
  pages: z
    .string()
    .optional()
    .describe(
      "Pages to process. Specify page numbers separated by commas (e.g., '1,3,5') or ranges with " +
      "dashes (e.g., '3-7'). Leave empty to process all pages"
    ),
  certificatePath: z
    .string()
    .optional()
    .describe(
      "Path to the certificate image file to use when signing. Supported image types: jpeg, jpg, bmp, png, gif. " +
      "This is a visual certificate image, not a cryptographic certificate. Optional — you can sign without it"
    ),
  certificatePosition: z
    .string()
    .optional()
    .describe(
      "Certificate position as a SINGLE JSON OBJECT string (NOT an array) — required if certificatePath is provided. " +
      'Example: {"pageIndex": 0, "left": 50, "top": 50, "width": 200, "height": 80, ' +
      '"reason": "Signed using Sign PDF service", "certifyPermission": "AllowFormFill"}. ' +
      "Fields: pageIndex (zero-based page number), left/top/width/height (position and size in points), " +
      "reason (optional text), certifyPermission (0 or 'AllowNoChanges' default, 1 or 'AllowFormFill'). " +
      "IMPORTANT: Must be a single object {}, NOT an array [{}]. Use double quotes in JSON, not single quotes"
    ),
  signaturePaths: z
    .array(z.string())
    .optional()
    .describe(
      "Paths to signature image files. Supported image types: jpeg, jpg, bmp, png, gif. " +
      "You can provide multiple signature files — reference them by filename (without extension) " +
      "in signaturePositions via the 'signatureFileName' property"
    ),
  signaturePositions: z
    .string()
    .optional()
    .describe(
      "Signature positions as a JSON array string. Two options:\n" +
      "Option 1 — create new fields: " +
      '[{"pageIndex":0,"left":100,"top":200,"width":150,"height":50,"signatureFileName":"mySignature","reason":"Approved"}]\n' +
      "Option 2 — use existing signer field IDs: " +
      '[{"pageIndex":0,"signerFieldId":"Signature1","signatureFileName":"mySignature","reason":"Approved"}]\n' +
      "IMPORTANT: Use double quotes in JSON, not single quotes"
    ),
  ownerPassword: z
    .string()
    .optional()
    .describe(
      "Optional owner password to SET on the PDF (for adding NEW encryption). " +
      "Only used if the document does not already have an owner password. " +
      "To open an already-encrypted PDF use the 'password' field instead"
    ),
});

// Zod schema for Sign PDF Placeholder tool (v2)
export const SignPdfPlaceholderSchema = z.object({
  filePath: z.string().describe("Path to the PDF file to prepare with empty signature fields. Supported format: pdf. Maximum file size: 100MB"),
  outputPath: z.string().describe("Path where the PDF with placeholder signature fields should be saved (.pdf)"),
  positions: z
    .string()
    .describe(
      "Signature field positions as a JSON array string (required). Each position must include: " +
      "pageIndex (zero-based page number), left, top, width, height, signerFieldId (unique identifier). " +
      'Example: [{"pageIndex":0,"left":50,"top":150,"width":200,"height":80,"signerFieldId":"Certificate"},' +
      '{"pageIndex":0,"left":50,"top":250,"width":200,"height":80,"signerFieldId":"Signature1"}]. ' +
      "IMPORTANT: Use double quotes in JSON, not single quotes"
    ),
  password: z
    .string()
    .optional()
    .describe("Password to open/authenticate the PDF file (if password-protected)"),
  pages: z
    .string()
    .optional()
    .describe(
      "Pages to process. Specify page numbers separated by commas (e.g., '1,3,5') or ranges with " +
      "dashes (e.g., '3-7'). Leave empty to process all pages"
    ),
  ownerPassword: z
    .string()
    .optional()
    .describe(
      "Optional owner password to SET on the PDF (for adding NEW encryption to the placeholder document). " +
      "Use the 'password' field (not ownerPassword) in subsequent signing calls to authenticate with this password"
    ),
});