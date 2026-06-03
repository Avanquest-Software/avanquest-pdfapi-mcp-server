import { extname } from "path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { writeFile } from "fs/promises";
import { AvanquestPdfApiClient } from "./api-client.js";
import * as schemas from "./tools.js";
import { CallToolResult, McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

function validateOutputPath(outputPath: string, allowedExtension: string): void {
  const ext = extname(outputPath).toLowerCase();
  if (ext !== allowedExtension) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `Output path must have extension ${allowedExtension}. Got: ${ext || "(no extension)"}`
    );
  }
}

// Environment variable validation
function validateEnvironment(): { apiKey: string; baseUrl: string } {
  const apiKey = process.env.AVANQUEST_PDF_API_KEY;
  if (!apiKey) {
    console.error(
      "Error: AVANQUEST_PDF_API_KEY environment variable is required"
    );
    console.error(
      "Please set it in your .env file or environment before starting the server"
    );
    process.exit(1);
  }

  const baseUrl =
    process.env.AVANQUEST_PDF_API_BASE_URL ||
    "https://api-developers.avanquest.com";

  return { apiKey, baseUrl };
}

function makeSuccessResponse(message: string): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: message,
      },
    ],
  };
}

function makeErrorResponse(error: unknown): CallToolResult {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [
      {
        type: "text",
        text: `Error: ${message}`,
      },
    ],
    isError: true,
  };
}

import MANIFEST from "../manifest.json" with { type: "json" };

// Create MCP server
export function createMcpServer() {
  // Initialize environment and API client
  const { apiKey, baseUrl } = validateEnvironment();
  const apiClient = new AvanquestPdfApiClient(apiKey, baseUrl);

  const server = new McpServer({
    name: MANIFEST.name,
    version: MANIFEST.version,
  });

  // Register pdf_convert_to_word tool
  server.registerTool(
    "pdf_convert_to_word",
    {
      title: "Convert PDF to Word",
      description:
        "Converts a PDF file to Microsoft Word format (.docx). Extracts text and images while preserving " +
        "formatting as closely as possible. Maximum file size: 100MB. Saves the converted Word document " +
        "to the specified output path.",
      inputSchema: schemas.PdfConvertToWordSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (params: z.infer<typeof schemas.PdfConvertToWordSchema>) => {
      try {
        const input = schemas.PdfConvertToWordSchema.parse(params);
        validateOutputPath(input.outputPath, ".docx");
        const result = await apiClient.convertPdf(input.filePath, "word", {
          password: input.password,
          pages: input.pages,
        });

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully converted PDF to Word format.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output file: ${input.outputPath}\n` +
          `File size: ${result.result.length} bytes`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register pdf_convert_to_powerpoint tool
  server.registerTool(
    "pdf_convert_to_powerpoint",
    {
      title: "Convert PDF to PowerPoint",
      description:
        "Converts a PDF file to Microsoft PowerPoint format (.pptx). Each PDF page becomes a slide with " +
        "text and images preserved. Maximum file size: 100MB. Saves the converted PowerPoint presentation " +
        "to the specified output path.",
      inputSchema: schemas.PdfConvertToPowerPointSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (params: z.infer<typeof schemas.PdfConvertToPowerPointSchema>) => {
      try {
        const input = schemas.PdfConvertToPowerPointSchema.parse(params);
        validateOutputPath(input.outputPath, ".pptx");
        const result = await apiClient.convertPdf(
          input.filePath,
          "powerPoint",
          {
            password: input.password,
            pages: input.pages,
          }
        );

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully processed file.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output file: ${input.outputPath}\n` +
          `File size: ${result.result.length} bytes`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register pdf_convert_to_excel tool
  server.registerTool(
    "pdf_convert_to_excel",
    {
      title: "Convert PDF to Excel",
      description:
        "Converts a PDF file to Microsoft Excel format (.xlsx). Extracts tables and text content into " +
        "spreadsheet format. You can choose how to organize the data: by table, by page, or entire " +
        "document. Optionally extract only tables. Maximum file size: 100MB. Saves the converted Excel " +
        "workbook to the specified output path.",
      inputSchema: schemas.PdfConvertToExcelSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (params: z.infer<typeof schemas.PdfConvertToExcelSchema>) => {
      try {
        const input = schemas.PdfConvertToExcelSchema.parse(params);
        validateOutputPath(input.outputPath, ".xlsx");
        const result = await apiClient.convertPdf(input.filePath, "excel", {
          password: input.password,
          pages: input.pages,
          convertPdfToExcelType: input.convertPdfToExcelType,
          keepTablesOnly: input.keepTablesOnly,
        });

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully processed file.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output file: ${input.outputPath}\n` +
          `File size: ${result.result.length} bytes`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register pdf_merge tool
  server.registerTool(
    "pdf_merge",
    {
      title: "Merge PDF Files",
      description:
        "Merges multiple PDF files into a single PDF document. Requires at least 2 files. You can " +
        "specify which pages to include from each file and their order. Maximum total size: 100MB. Saves " +
        "the merged PDF to the specified output path.",
      inputSchema: schemas.PdfMergeSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (params: z.infer<typeof schemas.PdfMergeSchema>) => {
      try {
        const input = schemas.PdfMergeSchema.parse(params);
        validateOutputPath(input.outputPath, ".pdf");
        const result = await apiClient.mergePdfs(input.files);

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully processed file.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output file: ${input.outputPath}\n` +
          `File size: ${result.result.length} bytes`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register pdf_compress tool
  server.registerTool(
    "pdf_compress",
    {
      title: "Compress PDF",
      description:
        "Compresses a PDF file to reduce its size while maintaining quality. Choose from 5 quality " +
        "levels (min, low, medium, high, max). Maximum file size: 100MB. Saves the compressed PDF to " +
        "the specified output path.",
      inputSchema: schemas.PdfCompressSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (params: z.infer<typeof schemas.PdfCompressSchema>) => {
      try {
        const input = schemas.PdfCompressSchema.parse(params);
        validateOutputPath(input.outputPath, ".pdf");
        const result = await apiClient.compressPdf(input.filePath, {
          password: input.password,
          pages: input.pages,
          quality: input.quality,
        });

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully processed file.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output file: ${input.outputPath}\n` +
          `File size: ${result.result.length} bytes`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register pdf_split tool
  server.registerTool(
    "pdf_split",
    {
      title: "Split PDF",
      description:
        "Splits a PDF document into multiple separate PDF files. You can split by specific pages or " +
        "page ranges. Each output file will be numbered sequentially. Maximum file size: 100MB. Saves a " +
        "ZIP archive containing the split PDFs to the specified output path.",
      inputSchema: schemas.PdfSplitSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (params: z.infer<typeof schemas.PdfSplitSchema>) => {
      try {
        const input = schemas.PdfSplitSchema.parse(params);
        validateOutputPath(input.outputPath, ".zip");
        const result = await apiClient.splitPdf(input.filePath, {
          password: input.password,
          pages: input.pages,
          labelStart: input.labelStart,
        });

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully processed file.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output file: ${input.outputPath}\n` +
          `File size: ${result.result.length} bytes`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register pdf_to_text tool
  server.registerTool(
    "pdf_to_text",
    {
      title: "Convert PDF to Text",
      description:
        "Extracts all text from a PDF document and converts it to plain text format. Optionally add " +
        "page dividers and include text outside page bounds. Maximum file size: 100MB. Saves the text " +
        "file to the specified output path.",
      inputSchema: schemas.PdfToTextSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (params: z.infer<typeof schemas.PdfToTextSchema>) => {
      try {
        const input = schemas.PdfToTextSchema.parse(params);
        validateOutputPath(input.outputPath, ".txt");
        const result = await apiClient.pdfToText(input.filePath, {
          password: input.password,
          pages: input.pages,
          divider: input.divider,
          convertCropped: input.convertCropped,
        });

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully processed file.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output file: ${input.outputPath}\n` +
          `File size: ${result.result.length} bytes`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register pdf_delete_pages tool
  server.registerTool(
    "pdf_delete_pages",
    {
      title: "Delete PDF Pages",
      description:
        "Removes specific pages from a PDF document. Specify which pages to delete using page numbers " +
        "or ranges. Maximum file size: 100MB. Saves the modified PDF to the specified output path.",
      inputSchema: schemas.DeletePdfPagesSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (params: z.infer<typeof schemas.DeletePdfPagesSchema>) => {
      try {
        const input = schemas.DeletePdfPagesSchema.parse(params);
        validateOutputPath(input.outputPath, ".pdf");
        const result = await apiClient.deletePdfPages(
          input.filePath,
          input.pages,
          input.password
        );

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully processed file.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output file: ${input.outputPath}\n` +
          `File size: ${result.result.length} bytes`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register pdf_rotate tool
  server.registerTool(
    "pdf_rotate",
    {
      title: "Rotate PDF Pages",
      description:
        "Rotates pages in a PDF document by 90, 180, or 270 degrees clockwise. You can rotate specific " +
        "pages or all pages. Perfect for correcting scanned documents or misaligned pages. Maximum file " +
        "size: 100MB. Saves the rotated PDF to the specified output path.",
      inputSchema: schemas.RotatePdfSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (params: z.infer<typeof schemas.RotatePdfSchema>) => {
      try {
        const input = schemas.RotatePdfSchema.parse(params);
        validateOutputPath(input.outputPath, ".pdf");
        const result = await apiClient.rotatePdf(input.filePath, {
          password: input.password,
          pages: input.pages,
          rotateDegrees: input.rotateDegrees,
        });

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully processed file.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output file: ${input.outputPath}\n` +
          `File size: ${result.result.length} bytes`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register html_to_pdf tool
  server.registerTool(
    "html_to_pdf",
    {
      title: "Convert HTML to PDF",
      description:
        "Converts HTML content to a PDF document. You can provide either an HTML file or a URL. Choose " +
        "from various page formats (singlePage, letter, legal, tabloid, ledger, A0-A6). Maximum file " +
        "size: 100MB. Saves the converted PDF to the specified output path.",
      inputSchema: schemas.HtmlToPdfSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (params: z.infer<typeof schemas.HtmlToPdfSchema>) => {
      try {
        const input = schemas.HtmlToPdfSchema.parse(params);
        validateOutputPath(input.outputPath, ".pdf");
        const result = await apiClient.htmlToPdf({
          filePath: input.filePath,
          url: input.url,
          format: input.format,
        });

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully converted HTML to PDF.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output file: ${input.outputPath}\n` +
          `File size: ${result.result.length} bytes`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register img_to_pdf tool
  server.registerTool(
    "img_to_pdf",
    {
      title: "Convert Image to PDF",
      description:
        "Converts an image file to a PDF document. Supported image formats: JPEG, JPG, BMP, PNG, GIF. " +
        "Perfect for converting scanned documents, photos, or screenshots into PDF format. Maximum file " +
        "size: 100MB. Saves the converted PDF to the specified output path.",
      inputSchema: schemas.ImgToPdfSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (params: z.infer<typeof schemas.ImgToPdfSchema>) => {
      try {
        const input = schemas.ImgToPdfSchema.parse(params);
        validateOutputPath(input.outputPath, ".pdf");
        const result = await apiClient.imgToPdf(input.imagePath);

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully converted image to PDF.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output file: ${input.outputPath}\n` +
          `File size: ${result.result.length} bytes`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register txt_to_pdf tool
  server.registerTool(
    "txt_to_pdf",
    {
      title: "Convert Text to PDF",
      description:
        "Converts a plain text file to a PDF document. Takes a .txt file and transforms it into a " +
        "well-structured, professional PDF. Ideal for creating reports, notes, or documentation from " +
        "text files. Maximum file size: 100MB. Saves the converted PDF to the specified output path.",
      inputSchema: schemas.TxtToPdfSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (params: z.infer<typeof schemas.TxtToPdfSchema>) => {
      try {
        const input = schemas.TxtToPdfSchema.parse(params);
        validateOutputPath(input.outputPath, ".pdf");
        const result = await apiClient.txtToPdf(input.filePath);

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully converted text file to PDF.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output file: ${input.outputPath}\n` +
          `File size: ${result.result.length} bytes`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register pdf_password_protect tool
  server.registerTool(
    "pdf_password_protect",
    {
      title: "Password Protect PDF",
      description:
        "Adds or changes password protection on a PDF document. Secure your PDF files by requiring a " +
        "password to open them. You can set a new password on an unprotected PDF or change the password " +
        "on an already protected PDF. Maximum file size: 100MB. Saves the password-protected PDF to the " +
        "specified output path.",
      inputSchema: schemas.PasswordProtectPdfSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (params: z.infer<typeof schemas.PasswordProtectPdfSchema>) => {
      try {
        const input = schemas.PasswordProtectPdfSchema.parse(params);
        validateOutputPath(input.outputPath, ".pdf");
        const result = await apiClient.passwordProtectPdf(
          input.filePath,
          input.newPassword,
          input.password
        );

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully password-protected PDF.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output file: ${input.outputPath}\n` +
          `File size: ${result.result.length} bytes`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register pdf_unlock tool
  server.registerTool(
    "pdf_unlock",
    {
      title: "Unlock PDF",
      description:
        "Removes password protection from a PDF document. Unlock a password-protected PDF by providing " +
        "the correct password, allowing full access to its contents for viewing, editing, or printing. " +
        "Maximum file size: 100MB. Saves the unlocked PDF to the specified output path.",
      inputSchema: schemas.UnlockPdfSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (params: z.infer<typeof schemas.UnlockPdfSchema>) => {
      try {
        const input = schemas.UnlockPdfSchema.parse(params);
        validateOutputPath(input.outputPath, ".pdf");
        const result = await apiClient.unlockPdf(input.filePath, input.password);

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully unlocked PDF.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output file: ${input.outputPath}\n` +
          `File size: ${result.result.length} bytes`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register pdf_resize tool
  server.registerTool(
    "pdf_resize",
    {
      title: "Resize PDF Pages",
      description:
        "Resizes PDF pages to specified dimensions in inches. You can adjust width and height " +
        "independently (range: 0.1 to 200 inches). Apply to specific pages or all pages. Perfect for " +
        "standardizing document sizes or preparing PDFs for printing. Maximum file size: 100MB. Saves " +
        "the resized PDF to the specified output path.",
      inputSchema: schemas.ResizePdfSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (params: z.infer<typeof schemas.ResizePdfSchema>) => {
      try {
        const input = schemas.ResizePdfSchema.parse(params);
        validateOutputPath(input.outputPath, ".pdf");
        const result = await apiClient.resizePdf(input.filePath, {
          password: input.password,
          pages: input.pages,
          width: input.width,
          height: input.height,
        });

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully resized PDF.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output file: ${input.outputPath}\n` +
          `File size: ${result.result.length} bytes`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register pdf_to_json tool
  server.registerTool(
    "pdf_to_json",
    {
      title: "Convert PDF to JSON",
      description:
        "Converts PDF content to structured JSON format. Extracts text and metadata from the PDF and " +
        "organizes it into a machine-readable JSON file. Perfect for data extraction, content indexing, " +
        "and integration with APIs. Maximum file size: 100MB. Saves the JSON file to the specified " +
        "output path.",
      inputSchema: schemas.PdfToJsonSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (params: z.infer<typeof schemas.PdfToJsonSchema>) => {
      try {
        const input = schemas.PdfToJsonSchema.parse(params);
        validateOutputPath(input.outputPath, ".json");
        const result = await apiClient.pdfToJson(input.filePath, {
          password: input.password,
          pages: input.pages,
        });

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully converted PDF to JSON.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output file: ${input.outputPath}\n` +
          `File size: ${result.result.length} bytes`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register pdf_add_watermark tool
  server.registerTool(
    "pdf_add_watermark",
    {
      title: "Add Watermark to PDF",
      description:
        "Adds a customizable watermark to PDF documents. You can use text (with font, size, color, " +
        "bold, italic options) or an image/PDF file as the watermark. Control placement, rotation " +
        "(0, 45, 90, 270, 315 degrees), opacity (0-1), position (center, corners, sides), and whether " +
        "it appears behind or above content. Perfect for branding, security, or marking documents as " +
        "confidential. Maximum file size: 100MB. Saves the watermarked PDF to the specified output path.",
      inputSchema: schemas.AddWatermarkToPdfSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (params: z.infer<typeof schemas.AddWatermarkToPdfSchema>) => {
      try {
        const input = schemas.AddWatermarkToPdfSchema.parse(params);
        validateOutputPath(input.outputPath, ".pdf");
        const result = await apiClient.addWatermarkToPdf(input.filePath, {
          password: input.password,
          pages: input.pages,
          text: input.text,
          fontFamily: input.fontFamily,
          fontSize: input.fontSize,
          fontColor: input.fontColor,
          bold: input.bold,
          italic: input.italic,
          sourceFilePath: input.sourceFilePath,
          sourceFilePassword: input.sourceFilePassword,
          sourceFilePageNumber: input.sourceFilePageNumber,
          sourceFileScale: input.sourceFileScale,
          rotation: input.rotation,
          opacity: input.opacity,
          position: input.position,
          isBehind: input.isBehind,
        });

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully added watermark to PDF.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output file: ${input.outputPath}\n` +
          `File size: ${result.result.length} bytes`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register pdf_analyze_tag tool
  server.registerTool(
    "pdf_analyze_tag",
    {
      title: "Analyze PDF",
      description:
        "Analyzes a PDF document and returns a JSON array of tags.\n" + 
        "Possible tags include:\n" +
        " - 'form' - The document has an AcroForm with fields\n" + 
        " - 'outline' - The document has Outlines (Bookmarks in terms of Soda PDF)\n" +
        " - 'attachment' - The document has File attachments\n" +
        " - 'optional-content' - The document has OCGroups (Layers in terms of Soda PDF)\n" +
        " - 'signed' - The document has a signed Sig field with valid integrity\n" +
        " - 'comments' - The document has Markup annotations (the ones that have popup on " +
        "double-click in Soda PDF)\n" +
        " - 'text' - The document has text in page content\n" +
        " - 'image' - The document has raster images in page content\n" +
        " - 'vector-image' - The document has vector images in page content\n" +
        " - 'image-for-ocr' - The document has raster images suitable for OCR (width > 50 and height > 50)\n" +
        " - 'maybe-scanned' - The document only contains raster images that cover > 95% of a page " +
        "and doesn't contain other objects or text\n" +
        "Maximum file size: 100MB.",
      inputSchema: schemas.PdfAnalyzeTagSchema.shape,
      annotations: { readOnlyHint: true, }
    },
    async (params: z.infer<typeof schemas.PdfAnalyzeTagSchema>) => {
      try {
        const input = schemas.PdfAnalyzeTagSchema.parse(params);
        const result = await apiClient.pdfAnalyzeTag(input.filePath, {
          password: input.password,
          pages: input.pages,
        });

        return makeSuccessResponse(`Successfully analyzed PDF. \n\nTags: ${result.result}`);
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register pdf_insight tool
  server.registerTool(
    "pdf_insight",
    {
      title: "PDF Insight",
      description:
        "Analyzes a PDF document using AI and extracts structured insights: document type, category, " +
        "intended audience, keywords, purpose, tone, and whether it contains a signature. " +
        "Returns a JSON file with all extracted metadata. " +
        "Supported input format: pdf. Maximum file size: 100MB.",
      inputSchema: schemas.PdfInsightSchema.shape,
      annotations: { readOnlyHint: true },
    },
    async (params: z.infer<typeof schemas.PdfInsightSchema>) => {
      try {
        const input = schemas.PdfInsightSchema.parse(params);
        validateOutputPath(input.outputPath, ".json");
        const result = await apiClient.pdfInsight(input.filePath, {
          password: input.password,
          pages: input.pages,
          modelType: input.modelType,
        });

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully extracted insights from PDF.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output saved to: ${input.outputPath}`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register pdf_document_extract tool
  server.registerTool(
    "pdf_document_extract",
    {
      title: "Extract data from a PDF or image file",
      description:
        "Extracts structured data from a PDF or image file and returns the result as a Markdown document. " +
        "Supported input formats: pdf, jpg, jpeg, png, tiff, bmp, gif, heic, webp. " +
        "Maximum file size: 100MB.",
      inputSchema: schemas.DocumentExtractSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (params: z.infer<typeof schemas.DocumentExtractSchema>) => {
      try {
        const input = schemas.DocumentExtractSchema.parse(params);
        validateOutputPath(input.outputPath, ".md");
        const result = await apiClient.documentExtract(input.filePath, {
          password: input.password,
          pages: input.pages,
        });

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully extracted data from the file.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output saved to: ${input.outputPath}`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register pdf_ocr tool
  server.registerTool(
    "pdf_ocr",
    {
      title: "OCR a PDF or image file",
      description:
        "Performs Optical Character Recognition (OCR) on a PDF or image file and returns a searchable PDF " +
        "with an embedded text layer. Useful for scanned documents and image-based PDFs where text is not selectable. " +
        "Supported input formats: pdf, jpg, jpeg, png, tiff, bmp, gif, heic, webp. " +
        "Maximum file size: 100MB.",
      inputSchema: schemas.OcrPdfSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (params: z.infer<typeof schemas.OcrPdfSchema>) => {
      try {
        const input = schemas.OcrPdfSchema.parse(params);
        validateOutputPath(input.outputPath, ".pdf");
        const result = await apiClient.ocrPdf(input.filePath, {
          password: input.password,
          pages: input.pages,
          deskew: input.deskew,
        });

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully performed OCR on the file.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output saved to: ${input.outputPath}`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register sign_pdf tool
  server.registerTool(
    "sign_pdf",
    {
      title: "Sign a PDF file with visual signature and/or certificate stamp images",
      description:
        "Adds visual signature images and/or a visual certificate stamp to a PDF file. " +
        "IMPORTANT: This tool applies VISUAL (image-based) stamps only — it does NOT apply cryptographic digital signatures " +
        "(the kind that require a PKI certificate, private key, or produce a tamper-evident seal). " +
        "Use this tool when the user wants to: visually sign a document with their handwritten signature image; " +
        "add an approval signature image (like signing a paper form); place a company seal or certificate stamp on the document; " +
        "fill existing signature placeholder fields with a signature image. " +
        "Do NOT use this tool if the user explicitly asks for cryptographic signing, PKI, X.509, or digital certificates — " +
        "explain that this API adds visual stamps only. " +
        "Signing modes (signType): " +
        "'signature' — approval-style: place one or more handwritten/image signatures on the page (like physically signing a form). " +
        "  Requires: signaturePaths (image files) + signaturePositions (where to place them). " +
        "'certificate' — certifying-style: place a single visual certificate/authority stamp on the document (like a notary seal or company stamp). " +
        "  Requires: certificatePath (image file) + certificatePosition (where to place it). " +
        "'both' — apply a certificate stamp AND one or more signature images simultaneously. " +
        "Always ask the user which type they need if not clear from context. " +
        "All image files must be jpeg, jpg, bmp, png, or gif. Maximum input file size: 100MB.",
      inputSchema: schemas.SignPdfBaseSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (params: z.infer<typeof schemas.SignPdfSchema>) => {
      try {
        const input = schemas.SignPdfSchema.parse(params);
        validateOutputPath(input.outputPath, ".pdf");
        const result = await apiClient.signPdf(input.filePath, {
          password: input.password,
          pages: input.pages,
          certificatePath: input.certificatePath,
          certificatePosition: input.certificatePosition,
          signaturePaths: input.signaturePaths,
          signaturePositions: input.signaturePositions,
          ownerPassword: input.ownerPassword,
        });

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully signed the PDF.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output saved to: ${input.outputPath}`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  // Register sign_pdf_placeholder tool
  server.registerTool(
    "sign_pdf_placeholder",
    {
      title: "Add empty signature placeholder fields to a PDF file",
      description:
        "Creates empty signature placeholder fields in a PDF file using the Sign PDF v2 placeholder API. " +
        "Useful for multi-step workflows: first create placeholders (step 1), then sign each field " +
        "using sign_pdf with signerFieldId (steps 2+). " +
        "positions must be a valid JSON array string with double quotes. " +
        "Output is a PDF with empty signature widgets. Maximum input file size: 100MB.",
      inputSchema: schemas.SignPdfPlaceholderSchema.shape,
      annotations: { destructiveHint: true },
    },
    async (params: z.infer<typeof schemas.SignPdfPlaceholderSchema>) => {
      try {
        const input = schemas.SignPdfPlaceholderSchema.parse(params);
        validateOutputPath(input.outputPath, ".pdf");
        const result = await apiClient.signPdfPlaceholder(
          input.filePath,
          input.positions,
          {
            password: input.password,
            pages: input.pages,
            ownerPassword: input.ownerPassword,
          }
        );

        await writeFile(input.outputPath, result.result);

        return makeSuccessResponse(
          `Successfully added signature placeholders to the PDF.\n\n` +
          `Operation ID: ${result.operationId}\n` +
          `Output saved to: ${input.outputPath}`
        );
      } catch (error: unknown) {
        return makeErrorResponse(error);
      }
    }
  );

  return server;
}
