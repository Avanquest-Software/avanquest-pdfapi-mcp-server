# Avanquest PDF API MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)

MCP server that gives Claude access to PDF manipulation tools powered by the [Avanquest PDF API](https://developers.avanquest.com).

## Features

- **Convert** PDFs to Word, PowerPoint, Excel, plain text, or JSON
- **Convert** HTML, images, and text files to PDF
- **Merge** multiple PDFs into one document
- **Split** a PDF into separate files
- **Compress** PDFs with configurable quality levels
- **Edit pages** — delete, rotate, or resize
- **Protect** PDFs with passwords or remove existing protection
- **Watermark** PDFs with custom text or images
- **Analyze** PDFs for tags, forms, signatures, and attachments

Input file size limit: 10 MB per file. Processed results are available for download for 10 minutes.
Works best with Claude's Filesystem plugin for local file access.

## Installation

### From the Anthropic Directory

Install from the [Anthropic MCP Directory](https://www.anthropic.com/mcp-directory). When prompted, enter your **Avanquest PDF API key**.

### Manual Setup

```bash
npx avanquest-pdfapi-mcp-server
```

Or clone and build from source:

```bash
git clone https://github.com/Avanquest-Software/Avanquest-PDF-API.git
cd avanquest-pdfapi-mcp-server
npm install
npm run build
```

Get a free API key at [developers.avanquest.com](https://developers.avanquest.com).

## Configuration

| Setting                 | Required | Description                                                                    |
|-------------------------|----------|--------------------------------------------------------------------------------|
| `AVANQUEST_PDF_API_KEY` | Yes      | Your API key from [developers.avanquest.com](https://developers.avanquest.com) |

## Usage Examples

**Convert a PDF to Word:**
> "Convert /Users/me/report.pdf to a Word document and save it to /Users/me/report.docx"

Extension uploads the file, waits for processing, and saves the resulting `.docx` file to the specified path.

**Merge PDFs:**
> "Merge /Users/me/part1.pdf and /Users/me/part2.pdf into a single file at /Users/me/combined.pdf"

Extension uploads both files, merges them in order, and saves the combined PDF to the specified path.

**Compress a PDF:**
> "Compress /Users/me/presentation.pdf with medium quality and save the result to /Users/me/presentation-small.pdf"

Extension uploads the file, applies medium compression, and saves the smaller PDF to the specified path.

**Extract text:**
> "Extract all text from pages 1-5 of /Users/me/book.pdf and save it to /Users/me/excerpt.txt"

Extension uploads the file, extracts text from the selected pages, and saves the plain-text output to the specified path.

**Add a watermark:**
> "Add a red 'CONFIDENTIAL' watermark at 45 degrees to /Users/me/doc.pdf and save it to /Users/me/doc-watermarked.pdf"

Extension uploads the file, applies the text watermark with the specified color and rotation, and saves the watermarked PDF to the specified path.

## Privacy Policy

Files you upload are processed via the Avanquest PDF API and subject to the [Avanquest Privacy Policy](https://developers.avanquest.com/privacy-policy). Processed files are automatically deleted from Avanquest servers 10 minutes after completion.

## Support

- Documentation: [developers.avanquest.com](https://developers.avanquest.com)
- Email: [support@avanquest.com](mailto:support@avanquest.com)

## License

[MIT](LICENSE)
