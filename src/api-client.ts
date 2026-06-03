/**
 * API client for Avanquest PDF API
 * Handles authentication, file uploads, operation polling, and result downloads
 */

import { basename, extname } from "path";
import { readFile, access, stat } from "fs/promises";
import { constants } from "fs";

/**
 * Base error for all failures originating in the PDF API client.
 * Higher layers (e.g. the MCP adapter) can catch this and translate
 * to their own error types.
 */
export class PdfApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfApiError";
  }
}

/** Caller-supplied input was rejected (bad path, bad config, etc.). */
export class PdfApiValidationError extends PdfApiError {
  constructor(message: string) {
    super(message);
    this.name = "PdfApiValidationError";
  }
}

/** The remote API or network layer failed. */
export class PdfApiRequestError extends PdfApiError {
  readonly statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "PdfApiRequestError";
    this.statusCode = statusCode;
  }
}

// Common response types
export interface OperationResponse {
  id: string;
}

export interface ErrorResponse {
  error?: ErrorStatus;
  message?: string;
}

export type ErrorStatus =
  | "unknowN_ERROR"
  | "filE_REQUIRED"
  | "filE_INVALID_TYPE"
  | "filE_MORE_THAN_10MB"
  | "filE_MORE_THAN_100MB"
  | "filE_CORRUPTED_HEADER_MISSING"
  | "filE_CORRUPTED_TRAILER_MISSING"
  | "filE_OR_URL_NO_PROVIDED"
  | "fileS_NO_UPLOADED"
  | "fileS_LEST_TWO_OR_MORE_REQUIRED"
  | "sourcE_FILE_INVALID_TYPE"
  | "pageS_INVALID_FORMAT"
  | "pageS_INVALID_RANGE"
  | "pageS_REQUIRED"
  | "operatioN_NOT_FOUND"
  | "operatioN_DATA_NOT_FOUND"
  | "operatioN_RESULT_NOT_READY"
  | "operatioN_RESULT_CANNOT_DOWNLOADED"
  | "operatioN_CANCELLED_TIME_LIMIT"
  | "processinG_TRANSLATION_API_FAILED"
  | "processinG_TRANSLATION_DIRECTION_FAILED"
  | "processinG_OCR_API_FAILED"
  | "numbeR_FORMAT_INVALID"
  | "floaT_INVALID_SEPARATOR_COMMA"
  | "widtH_INVALID_RANGE"
  | "heighT_INVALID_RANGE"
  | "sourcE_FILE_PAGE_NUMBER_INVALID_RANGE"
  | "sourcE_FILE_SCALE_INVALID_RANGE"
  | "opacitY_FILE_SCALE_INVALID_RANGE"
  | "rotatE_INVALID_ROTATE_PAGE_0"
  | "rotatE_INVALID_ROTATE_PAGE_90"
  | "rotatE_INVALID_ROTATE_PAGE_180"
  | "rotatE_INVALID_ROTATE_PAGE_270"
  | "rotatE_INVALID_ROTATE_PAGES_0"
  | "rotatE_INVALID_ROTATE_PAGES_90"
  | "rotatE_INVALID_ROTATE_PAGES_180"
  | "rotatE_INVALID_ROTATE_PAGES_270"
  | "contenT_INVALID_TEXT_OR_SOURCE_FILE_REQUIRED"
  | "fonT_FAMALY_INVALID_FORMAT"
  | "scalE_INVALID_RANGE"
  | "detecT_LANGUAGE_API_FAILED"
  | "passworD_FIELD_REQUIRED"
  | "neW_PASSWORD_FIELD_REQUIRED"
  | "imagE_REQUIRED"
  | "imagE_INVALID_TYPE"
  | "urL_INVALID"
  | "fielD_REQUIRED"
  | "certificatE_REQUIRED"
  | "certificatE_POSITION_REQUIRED"
  | "certificatE_POSITION_PARSE_FAILED"
  | "certificatE_IMAGE_TYPE_INVALID"
  | "signaturE_POSITIONS_REQUIRED"
  | "signaturE_POSITION_PARSE_FAILED"
  | "signaturE_IMAGE_TYPE_INVALID"
  | "prompT_REQUIRED"
  | "unknowN_FORBIDDEN"
  | "licensE_KEY_EXPIRED"
  | "licensE_KEY_REQUEST_LIMIT_EXCEEDED"
  | "scopE_FIELD_REQUIRED";

function extractApiErrorDetail(errorData: unknown): string | null {
  if (!errorData || typeof errorData !== "object") return null;
  const d = errorData as Record<string, unknown>;
  const code = typeof d.error === "string" ? d.error : null;
  const msg = typeof d.message === "string" ? d.message : null;
  if (code && msg) return `${code}: ${msg}`;
  if (code) return code;
  if (msg) return msg;
  return null;
}

// PDF Convert types
export type ConvertType = "word" | "powerPoint" | "excel";
export type ConvertPdfToExcelType =
  | "tablePerSheet"
  | "pagePerSheet"
  | "documentPerSheet";

// PDF Compress types
export type CompressionQuality = "min" | "low" | "medium" | "high" | "max";

// PDF Rotate types
export type RotateDegrees = "90" | "180" | "270";

// HTML to PDF page format types
export type HtmlToPdfFormat =
  | "singlePage"
  | "letter"
  | "legal"
  | "tabloid"
  | "ledger"
  | "a0"
  | "a1"
  | "a2"
  | "a3"
  | "a4"
  | "a5"
  | "a6";

// Watermark position types
export type WatermarkPosition =
  | "top"
  | "rightTop"
  | "right"
  | "rightBottom"
  | "bottom"
  | "leftBottom"
  | "left"
  | "leftTop"
  | "count"
  | "center";

// Watermark rotation types
export type WatermarkRotation = "0" | "45" | "90" | "270" | "315";

// Operation status response (complete schema from swagger)
export interface OperationStatusResponse {
  id: string;
  accountId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number;
  error?: ErrorResponse;
}

// PDF Merge item
export interface PdfMergeItem {
  filePath: string;
  password?: string;
  pages?: string;
}

export interface ConvertPdfOptions {
  password?: string;
  pages?: string;
  convertPdfToExcelType?: ConvertPdfToExcelType;
  keepTablesOnly?: boolean;
}

export interface CompressPdfOptions {
  password?: string;
  pages?: string;
  quality?: CompressionQuality;
}

export interface SplitPdfOptions {
  password?: string;
  pages?: string;
  labelStart?: number;
}

export interface PdfToTextOptions {
  password?: string;
  pages?: string;
  divider?: string;
  convertCropped?: boolean;
}

export interface RotatePdfOptions {
  password?: string;
  pages?: string;
  rotateDegrees?: RotateDegrees;
}

export interface HtmlToPdfOptions {
  filePath?: string;
  url?: string;
  format?: HtmlToPdfFormat;
}

export interface ResizePdfOptions {
  password?: string;
  pages?: string;
  width?: number;
  height?: number;
}

export interface PdfToJsonOptions {
  password?: string;
  pages?: string;
}

export interface PdfAnalyzeTagOptions {
  password?: string;
  pages?: string;
}

export interface AddWatermarkToPdfOptions {
  password?: string;
  pages?: string;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  bold?: boolean;
  italic?: boolean;
  sourceFilePath?: string;
  sourceFilePassword?: string;
  sourceFilePageNumber?: number;
  sourceFileScale?: number;
  rotation?: WatermarkRotation;
  opacity?: number;
  position?: WatermarkPosition;
  isBehind?: boolean;
}

export interface OcrPdfOptions {
  password?: string;
  pages?: string;
  deskew?: boolean;
}

export interface DocumentExtractOptions {
  password?: string;
  pages?: string;
}

export interface PdfInsightOptions {
  password?: string;
  pages?: string;
  modelType?: "external" | "internal";
}

export interface SignPdfOptions {
  password?: string;
  pages?: string;
  certificatePath?: string;
  certificatePosition?: string;
  signaturePaths?: string[];
  signaturePositions?: string;
  ownerPassword?: string;
}

export interface SignPdfPlaceholderOptions {
  password?: string;
  pages?: string;
  ownerPassword?: string;
}

// Allowed input extensions, kept here so the source of truth is in one place
const PDF_EXTS: readonly string[] = [".pdf"];
const IMAGE_EXTS: readonly string[] = [".jpg", ".jpeg", ".bmp", ".png", ".gif"];
const OCR_EXTS: readonly string[] = [
  ".pdf", ".jpg", ".jpeg", ".png", ".tiff", ".tif", ".bmp", ".gif", ".heic", ".webp",
];
const HTML_EXTS: readonly string[] = [".html", ".htm"];
const TEXT_EXTS: readonly string[] = [".txt"];
const WATERMARK_SOURCE_EXTS: readonly string[] = [
  ".pdf", ".jpg", ".jpeg", ".bmp", ".png", ".gif", ".wwf", ".tif", ".tiff",
];

export class AvanquestPdfApiClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly UPLOAD_TIMEOUT_MS = 60_000;
  private readonly STATUS_TIMEOUT_MS = 15_000;
  private readonly DOWNLOAD_TIMEOUT_MS = 60_000;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    const trimmed = baseUrl.replace(/\/$/, "");
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "https:") {
        throw new PdfApiValidationError("API base URL must use HTTPS");
      }
    } catch (error) {
      if (error instanceof PdfApiError) throw error;
      throw new PdfApiValidationError(`Invalid API base URL: ${baseUrl}`);
    }
    this.baseUrl = trimmed;
  }

  /**
   * Uploads a file and submits it for processing
   */
  private async uploadFile(
    endpoint: string,
    formData: FormData
  ): Promise<OperationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "X-API-KEY": this.apiKey,
        },
        body: formData,
        signal: AbortSignal.timeout(this.UPLOAD_TIMEOUT_MS),
      });

      if (!response.ok) {
        const errorData: unknown = await response.json().catch(() => ({}));
        console.error(
          `[avanquest-pdf-api] Upload to ${endpoint} failed with HTTP ${response.status}:`,
          errorData
        );
        const detail = extractApiErrorDetail(errorData);
        throw new PdfApiRequestError(
          `PDF API request failed with HTTP ${response.status}.${detail ? ` ${detail}` : " Please verify the input file and parameters and try again."}`,
          response.status
        );
      }

      const result = (await response.json()) as Partial<OperationResponse>;
      if (typeof result?.id !== "string" || result.id.length === 0) {
        console.error(
          `[avanquest-pdf-api] Upload to ${endpoint} returned an invalid response body:`,
          result
        );
        throw new PdfApiRequestError(
          "PDF API returned an invalid operation response (missing id)."
        );
      }
      return result as OperationResponse;
    } catch (error) {
      if (error instanceof PdfApiError) {
        throw error;
      }
      console.error(
        `[avanquest-pdf-api] Upload to ${endpoint} failed:`,
        error
      );
      throw new PdfApiRequestError(
        "Failed to reach the PDF API. Please check your network connection and try again."
      );
    }
  }

  /**
   * Checks the status of an operation
   */
  private async checkOperationStatus(
    operationId: string
  ): Promise<OperationStatusResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/operation/v1/${encodeURIComponent(operationId)}/status`,
        {
          headers: {
            "X-API-KEY": this.apiKey,
          },
          signal: AbortSignal.timeout(this.STATUS_TIMEOUT_MS),
        }
      );

      if (!response.ok) {
        const errorData: unknown = await response.json().catch(() => ({}));
        console.error(
          `[avanquest-pdf-api] Status check for operation ${operationId} failed with HTTP ${response.status}:`,
          errorData
        );
        throw new PdfApiRequestError(
          `Failed to check operation status (HTTP ${response.status}). Please try again.`,
          response.status
        );
      }

      return (await response.json()) as OperationStatusResponse;
    } catch (error) {
      if (error instanceof PdfApiError) {
        throw error;
      }
      console.error(
        `[avanquest-pdf-api] Status check for operation ${operationId} failed:`,
        error
      );
      throw new PdfApiRequestError(
        "Failed to reach the PDF API to check operation status. Please check your network connection and try again."
      );
    }
  }

  /**
   * Downloads the result of a completed operation
   *
   * IMPORTANT: Results are only available for 10 minutes after operation completion.
   * This method should be called immediately after the operation completes.
   */
  private async downloadOperationResult(
    operationId: string
  ): Promise<Buffer> {
    try {
      const response = await fetch(
        `${this.baseUrl}/operation/v1/${encodeURIComponent(operationId)}/download`,
        {
          headers: {
            "X-API-KEY": this.apiKey,
          },
          signal: AbortSignal.timeout(this.DOWNLOAD_TIMEOUT_MS),
        }
      );

      if (!response.ok) {
        throw new PdfApiRequestError(
          `Failed to download result: HTTP ${response.status}`,
          response.status
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      if (error instanceof PdfApiError) {
        throw error;
      }
      console.error(
        `[avanquest-pdf-api] Download for operation ${operationId} failed:`,
        error
      );
      throw new PdfApiRequestError(
        "Failed to reach the PDF API to download the result. Please check your network connection and try again."
      );
    }
  }

  /**
   * Polls operation status until completion or failure
   */
  private async pollOperationUntilComplete(
    operationId: string,
    maxAttempts: number = 60,
    intervalMs: number = 2000
  ): Promise<void> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.checkOperationStatus(operationId);

      switch (status.status) {
        case "completed":
          return;
        case "failed": {
          const errDetail = extractApiErrorDetail(status.error);
          console.error(
            `[avanquest-pdf-api] Operation ${operationId} failed:`,
            status.error
          );
          throw new PdfApiRequestError(
            `PDF API operation failed.${errDetail ? ` ${errDetail}` : " Please verify the input file and parameters and try again."}`
          );
        }
        case "pending":
        case "processing":
          break;
        default:
          console.error(
            `[avanquest-pdf-api] Operation ${operationId} returned an unknown status:`,
            status
          );
          throw new PdfApiRequestError(
            `PDF API returned an unknown operation status: ${String(status.status)}`
          );
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new PdfApiRequestError(
      `Operation timed out after ${maxAttempts} attempts`
    );
  }

  /**
   * Validates that a file exists and is readable
   */
  private async validateFilePath(
    filePath: string,
    allowedExtensions?: readonly string[]
  ): Promise<void> {
    if (allowedExtensions) {
      const ext = extname(filePath).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        throw new PdfApiValidationError(
          `File type not allowed. Expected: ${allowedExtensions.join(", ")}. Got: ${ext || "(no extension)"}`
        );
      }
    }

    try {
      await access(filePath, constants.R_OK);
    } catch (error) {
      throw new PdfApiValidationError(
        `File not found or not readable: ${filePath}`
      );
    }

    // Validate file size
    await this.validateFileSize(filePath);
  }

  /**
   * Validates that a file does not exceed the maximum allowed size (10MB)
   */
  private async validateFileSize(filePath: string): Promise<void> {
    try {
      const stats = await stat(filePath);
      if (stats.size > this.MAX_FILE_SIZE) {
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        throw new PdfApiValidationError(
          `File size (${sizeMB}MB) exceeds maximum allowed size (10MB): ${filePath}`
        );
      }
    } catch (error) {
      if (error instanceof PdfApiError) {
        throw error;
      }
      throw new PdfApiRequestError(
        `Failed to check file size: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Reads file from disk
   */
  private async readFileAsync(filePath: string): Promise<Buffer> {
    try {
      return await readFile(filePath);
    } catch (error) {
      throw new PdfApiRequestError(
        `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Reads a file and appends it to FormData as a Blob
   */
  private async appendFileToForm(
    formData: FormData,
    fieldName: string,
    filePath: string
  ): Promise<void> {
    const buffer = await this.readFileAsync(filePath);
    formData.append(
      fieldName,
      new Blob([new Uint8Array(buffer)]),
      basename(filePath)
    );
  }

  /**
   * Converts PDF to Office format (Word, PowerPoint, Excel)
   */
  async convertPdf(
    filePath: string,
    convertType: ConvertType,
    options: ConvertPdfOptions = {}
  ): Promise<{ operationId: string; result: Buffer }> {
    await this.validateFilePath(filePath, PDF_EXTS);

    const formData = new FormData();
    await this.appendFileToForm(formData, "file", filePath);
    formData.append("convertType", convertType);

    if (options.password) formData.append("password", options.password);
    if (options.pages) formData.append("pages", options.pages);
    if (options.convertPdfToExcelType)
      formData.append("convertPdfToExcelType", options.convertPdfToExcelType);
    if (options.keepTablesOnly !== undefined)
      formData.append("keepTablesOnly", String(options.keepTablesOnly));

    const operation = await this.uploadFile("/pdf-convert/v1", formData);
    await this.pollOperationUntilComplete(operation.id);
    const result = await this.downloadOperationResult(operation.id);

    return { operationId: operation.id, result };
  }

  /**
   * Merges multiple PDFs into one
   */
  async mergePdfs(
    items: PdfMergeItem[]
  ): Promise<{ operationId: string; result: Buffer }> {
    if (items.length < 2) {
      throw new PdfApiValidationError(
        "At least 2 files are required for merging"
      );
    }

    // Validate all files first
    await Promise.all(items.map((item) => this.validateFilePath(item.filePath, PDF_EXTS)));

    const formData = new FormData();

    // Read all files and append to form data
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      await this.appendFileToForm(formData, `items[${index}].file`, item.filePath);
      if (item.password)
        formData.append(`items[${index}].password`, item.password);
      if (item.pages) formData.append(`items[${index}].pages`, item.pages);
    }

    const operation = await this.uploadFile("/pdf-merge/v1", formData);
    await this.pollOperationUntilComplete(operation.id);
    const result = await this.downloadOperationResult(operation.id);

    return { operationId: operation.id, result };
  }

  /**
   * Compresses a PDF file
   */
  async compressPdf(
    filePath: string,
    options: CompressPdfOptions = {}
  ): Promise<{ operationId: string; result: Buffer }> {
    await this.validateFilePath(filePath, PDF_EXTS);

    const formData = new FormData();
    await this.appendFileToForm(formData, "file", filePath);

    if (options.password) formData.append("password", options.password);
    if (options.pages) formData.append("pages", options.pages);
    if (options.quality) formData.append("Quality", options.quality);

    const operation = await this.uploadFile("/pdf-compress/v1", formData);
    await this.pollOperationUntilComplete(operation.id);
    const result = await this.downloadOperationResult(operation.id);

    return { operationId: operation.id, result };
  }

  /**
   * Splits a PDF into multiple documents
   */
  async splitPdf(
    filePath: string,
    options: SplitPdfOptions = {}
  ): Promise<{ operationId: string; result: Buffer }> {
    await this.validateFilePath(filePath, PDF_EXTS);

    const formData = new FormData();
    await this.appendFileToForm(formData, "file", filePath);

    if (options.password) formData.append("password", options.password);
    if (options.pages) formData.append("pages", options.pages);
    if (options.labelStart !== undefined)
      formData.append("labelStart", String(options.labelStart));

    const operation = await this.uploadFile("/pdf-split/v1", formData);
    await this.pollOperationUntilComplete(operation.id);
    const result = await this.downloadOperationResult(operation.id);

    return { operationId: operation.id, result };
  }

  /**
   * Converts PDF to text
   */
  async pdfToText(
    filePath: string,
    options: PdfToTextOptions = {}
  ): Promise<{ operationId: string; result: Buffer }> {
    await this.validateFilePath(filePath, PDF_EXTS);

    const formData = new FormData();
    await this.appendFileToForm(formData, "file", filePath);

    if (options.password) formData.append("password", options.password);
    if (options.pages) formData.append("pages", options.pages);
    if (options.divider) formData.append("divider", options.divider);
    if (options.convertCropped !== undefined)
      formData.append("convertCropped", String(options.convertCropped));

    const operation = await this.uploadFile("/pdf-to-txt/v1", formData);
    await this.pollOperationUntilComplete(operation.id);
    const result = await this.downloadOperationResult(operation.id);

    return { operationId: operation.id, result };
  }

  /**
   * Deletes pages from a PDF
   */
  async deletePdfPages(
    filePath: string,
    pages: string,
    password?: string
  ): Promise<{ operationId: string; result: Buffer }> {
    await this.validateFilePath(filePath, PDF_EXTS);

    const formData = new FormData();
    await this.appendFileToForm(formData, "file", filePath);
    formData.append("pages", pages);

    if (password) formData.append("password", password);

    const operation = await this.uploadFile("/delete-pdf-pages/v1", formData);
    await this.pollOperationUntilComplete(operation.id);
    const result = await this.downloadOperationResult(operation.id);

    return { operationId: operation.id, result };
  }

  /**
   * Rotates pages in a PDF
   */
  async rotatePdf(
    filePath: string,
    options: RotatePdfOptions = {}
  ): Promise<{ operationId: string; result: Buffer }> {
    await this.validateFilePath(filePath, PDF_EXTS);

    const formData = new FormData();
    await this.appendFileToForm(formData, "file", filePath);

    if (options.password) formData.append("password", options.password);
    if (options.pages) formData.append("pages", options.pages);
    if (options.rotateDegrees)
      formData.append("rotateDegrees", options.rotateDegrees);

    const operation = await this.uploadFile("/rotate-pdf/v1", formData);
    await this.pollOperationUntilComplete(operation.id);
    const result = await this.downloadOperationResult(operation.id);

    return { operationId: operation.id, result };
  }

  /**
   * Converts HTML content or URL to PDF
   */
  async htmlToPdf(
    options: HtmlToPdfOptions
  ): Promise<{ operationId: string; result: Buffer }> {
    if (!options.filePath && !options.url) {
      throw new PdfApiValidationError(
        "Either filePath or url must be provided"
      );
    }

    if (options.filePath && options.url) {
      throw new PdfApiValidationError(
        "Only one of filePath or url should be provided, not both"
      );
    }

    const formData = new FormData();

    if (options.filePath) {
      await this.validateFilePath(options.filePath, HTML_EXTS);
      await this.appendFileToForm(formData, "file", options.filePath);
    }

    if (options.url) formData.append("url", options.url);
    if (options.format) formData.append("format", options.format);

    const operation = await this.uploadFile("/html-to-pdf/v1", formData);
    await this.pollOperationUntilComplete(operation.id);
    const result = await this.downloadOperationResult(operation.id);

    return { operationId: operation.id, result };
  }

  /**
   * Converts an image to PDF
   */
  async imgToPdf(imagePath: string): Promise<{ operationId: string; result: Buffer }> {
    await this.validateFilePath(imagePath, IMAGE_EXTS);

    const formData = new FormData();
    await this.appendFileToForm(formData, "image", imagePath);

    const operation = await this.uploadFile("/img-to-pdf/v1", formData);
    await this.pollOperationUntilComplete(operation.id);
    const result = await this.downloadOperationResult(operation.id);

    return { operationId: operation.id, result };
  }

  /**
   * Converts a text file to PDF
   */
  async txtToPdf(filePath: string): Promise<{ operationId: string; result: Buffer }> {
    await this.validateFilePath(filePath, TEXT_EXTS);

    const formData = new FormData();
    await this.appendFileToForm(formData, "file", filePath);

    const operation = await this.uploadFile("/txt-to-pdf/v1", formData);
    await this.pollOperationUntilComplete(operation.id);
    const result = await this.downloadOperationResult(operation.id);

    return { operationId: operation.id, result };
  }

  /**
   * Adds or changes password protection on a PDF
   */
  async passwordProtectPdf(
    filePath: string,
    newPassword: string,
    currentPassword?: string
  ): Promise<{ operationId: string; result: Buffer }> {
    await this.validateFilePath(filePath, PDF_EXTS);

    const formData = new FormData();
    await this.appendFileToForm(formData, "file", filePath);
    formData.append("newPassword", newPassword);

    if (currentPassword) formData.append("password", currentPassword);

    const operation = await this.uploadFile("/password-protect-pdf/v1", formData);
    await this.pollOperationUntilComplete(operation.id);
    const result = await this.downloadOperationResult(operation.id);

    return { operationId: operation.id, result };
  }

  /**
   * Removes password protection from a PDF
   */
  async unlockPdf(
    filePath: string,
    password: string
  ): Promise<{ operationId: string; result: Buffer }> {
    await this.validateFilePath(filePath, PDF_EXTS);

    const formData = new FormData();
    await this.appendFileToForm(formData, "file", filePath);
    formData.append("password", password);

    const operation = await this.uploadFile("/unlock-pdf/v1", formData);
    await this.pollOperationUntilComplete(operation.id);
    const result = await this.downloadOperationResult(operation.id);

    return { operationId: operation.id, result };
  }

  /**
   * Resizes PDF pages to specified dimensions
   */
  async resizePdf(
    filePath: string,
    options: ResizePdfOptions = {}
  ): Promise<{ operationId: string; result: Buffer }> {
    await this.validateFilePath(filePath, PDF_EXTS);

    const formData = new FormData();
    await this.appendFileToForm(formData, "file", filePath);

    if (options.password) formData.append("password", options.password);
    if (options.pages) formData.append("pages", options.pages);
    if (options.width !== undefined) formData.append("width", String(options.width));
    if (options.height !== undefined)
      formData.append("height", String(options.height));

    const operation = await this.uploadFile("/resize-pdf/v1", formData);
    await this.pollOperationUntilComplete(operation.id);
    const result = await this.downloadOperationResult(operation.id);

    return { operationId: operation.id, result };
  }

  /**
   * Converts PDF to JSON format
   */
  async pdfToJson(
    filePath: string,
    options: PdfToJsonOptions = {}
  ): Promise<{ operationId: string; result: Buffer }> {
    await this.validateFilePath(filePath, PDF_EXTS);

    const formData = new FormData();
    await this.appendFileToForm(formData, "file", filePath);

    if (options.password) formData.append("password", options.password);
    if (options.pages) formData.append("pages", options.pages);

    const operation = await this.uploadFile("/pdf-to-json/v1", formData);
    await this.pollOperationUntilComplete(operation.id);
    const result = await this.downloadOperationResult(operation.id);

    return { operationId: operation.id, result };
  }

  /**
   * Adds watermark to PDF (text or image)
   */
  async addWatermarkToPdf(
    filePath: string,
    options: AddWatermarkToPdfOptions = {}
  ): Promise<{ operationId: string; result: Buffer }> {
    if (!options.text && !options.sourceFilePath) {
      throw new PdfApiValidationError(
        "Either text or sourceFilePath must be provided for watermark"
      );
    }

    await this.validateFilePath(filePath, PDF_EXTS);
    if (options.sourceFilePath) {
      await this.validateFilePath(options.sourceFilePath, WATERMARK_SOURCE_EXTS);
    }

    const formData = new FormData();
    await this.appendFileToForm(formData, "file", filePath);

    if (options.password) formData.append("password", options.password);
    if (options.pages) formData.append("pages", options.pages);
    if (options.text) formData.append("text", options.text);
    if (options.fontFamily) formData.append("fontFamily", options.fontFamily);
    if (options.fontSize !== undefined)
      formData.append("fontSize", String(options.fontSize));
    if (options.fontColor) formData.append("fontColor", options.fontColor);
    if (options.bold !== undefined) formData.append("bold", String(options.bold));
    if (options.italic !== undefined)
      formData.append("italic", String(options.italic));

    if (options.sourceFilePath) {
      await this.appendFileToForm(formData, "sourceFile", options.sourceFilePath);
    }

    if (options.sourceFilePassword)
      formData.append("sourceFilePassword", options.sourceFilePassword);
    if (options.sourceFilePageNumber !== undefined)
      formData.append("sourceFilePageNumber", String(options.sourceFilePageNumber));
    if (options.sourceFileScale !== undefined)
      formData.append("sourceFileScale", String(options.sourceFileScale));
    if (options.rotation) formData.append("rotation", options.rotation);
    if (options.opacity !== undefined)
      formData.append("opacity", String(options.opacity));
    if (options.position) formData.append("position", options.position);
    if (options.isBehind !== undefined)
      formData.append("isBehind", String(options.isBehind));

    const operation = await this.uploadFile("/add-watermark-to-pdf/v1", formData);
    await this.pollOperationUntilComplete(operation.id);
    const result = await this.downloadOperationResult(operation.id);

    return { operationId: operation.id, result };
  }

  /**
   * Performs OCR on a PDF or image file, returning extracted text
   */
  async ocrPdf(
    filePath: string,
    options: OcrPdfOptions = {}
  ): Promise<{ operationId: string; result: Buffer }> {
    await this.validateFilePath(filePath, OCR_EXTS);

    const formData = new FormData();
    await this.appendFileToForm(formData, "file", filePath);

    if (options.password) formData.append("password", options.password);
    if (options.pages) formData.append("pages", options.pages);
    if (options.deskew !== undefined)
      formData.append("deskew", String(options.deskew));

    const operation = await this.uploadFile("/ocr/v1", formData);
    await this.pollOperationUntilComplete(operation.id);
    const result = await this.downloadOperationResult(operation.id);

    return { operationId: operation.id, result };
  }

  /**
   * Extracts structured data from a PDF or image file, returning a Markdown document
   */
  async documentExtract(
    filePath: string,
    options: DocumentExtractOptions = {}
  ): Promise<{ operationId: string; result: Buffer }> {
    await this.validateFilePath(filePath, OCR_EXTS);

    const formData = new FormData();
    await this.appendFileToForm(formData, "file", filePath);

    if (options.password) formData.append("password", options.password);
    if (options.pages) formData.append("pages", options.pages);

    const operation = await this.uploadFile("/document-extract/v1", formData);
    await this.pollOperationUntilComplete(operation.id);
    const result = await this.downloadOperationResult(operation.id);

    return { operationId: operation.id, result };
  }

  /**
   * Extracts AI-powered insights from a PDF document (category, type, keywords, tone, etc.)
   */
  async pdfInsight(
    filePath: string,
    options: PdfInsightOptions = {}
  ): Promise<{ operationId: string; result: Buffer }> {
    await this.validateFilePath(filePath, PDF_EXTS);

    const formData = new FormData();
    await this.appendFileToForm(formData, "file", filePath);

    if (options.password) formData.append("password", options.password);
    if (options.pages) formData.append("pages", options.pages);
    if (options.modelType) formData.append("modelType", options.modelType);

    const operation = await this.uploadFile("/pdf-insights/v1", formData);
    await this.pollOperationUntilComplete(operation.id);
    const result = await this.downloadOperationResult(operation.id);

    return { operationId: operation.id, result };
  }

  /**
   * Analyzes PDF and extracts tags
   */
  async pdfAnalyzeTag(
    filePath: string,
    options: PdfAnalyzeTagOptions = {}
  ): Promise<{ operationId: string; result: Buffer }> {
    await this.validateFilePath(filePath, PDF_EXTS);

    const formData = new FormData();
    await this.appendFileToForm(formData, "file", filePath);

    if (options.password) formData.append("password", options.password);
    if (options.pages) formData.append("pages", options.pages);

    const operation = await this.uploadFile("/pdf-analyze-tag/v1", formData);
    await this.pollOperationUntilComplete(operation.id);
    const result = await this.downloadOperationResult(operation.id);

    return { operationId: operation.id, result };
  }

  /**
   * Signs a PDF with certificate and/or signature images (v2).
   * certificate and signatures must be image files (jpeg, jpg, bmp, png, gif).
   * certificatePosition and signaturePositions must be valid JSON strings with double quotes.
   */
  async signPdf(
    filePath: string,
    options: SignPdfOptions = {}
  ): Promise<{ operationId: string; result: Buffer }> {
    await this.validateFilePath(filePath, PDF_EXTS);

    const formData = new FormData();
    await this.appendFileToForm(formData, "file", filePath);

    if (options.password) formData.append("password", options.password);
    if (options.pages) formData.append("pages", options.pages);

    if (options.certificatePath) {
      await this.validateFilePath(options.certificatePath, IMAGE_EXTS);
      await this.appendFileToForm(formData, "certificate", options.certificatePath);
    }
    if (options.certificatePosition) {
      formData.append("certificatePosition", options.certificatePosition);
    }

    if (options.signaturePaths && options.signaturePaths.length > 0) {
      for (const sigPath of options.signaturePaths) {
        await this.validateFilePath(sigPath, IMAGE_EXTS);
        await this.appendFileToForm(formData, "signatures", sigPath);
      }
    }
    if (options.signaturePositions) {
      formData.append("signaturePositions", options.signaturePositions);
    }

    if (options.ownerPassword) formData.append("ownerPassword", options.ownerPassword);

    const operation = await this.uploadFile("/sign-pdf/v2", formData);
    await this.pollOperationUntilComplete(operation.id);
    const result = await this.downloadOperationResult(operation.id);

    return { operationId: operation.id, result };
  }

  /**
   * Creates empty signature placeholder fields in a PDF (v2).
   * positions must be a valid JSON array string.
   */
  async signPdfPlaceholder(
    filePath: string,
    positions: string,
    options: SignPdfPlaceholderOptions = {}
  ): Promise<{ operationId: string; result: Buffer }> {
    await this.validateFilePath(filePath, PDF_EXTS);

    const formData = new FormData();
    await this.appendFileToForm(formData, "file", filePath);

    if (options.password) formData.append("password", options.password);
    if (options.pages) formData.append("pages", options.pages);

    formData.append("positions", positions);

    if (options.ownerPassword) formData.append("ownerPassword", options.ownerPassword);

    const operation = await this.uploadFile("/sign-pdf/v2/placeholder", formData);
    await this.pollOperationUntilComplete(operation.id);
    const result = await this.downloadOperationResult(operation.id);

    return { operationId: operation.id, result };
  }
}
