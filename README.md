# Avanquest PDF API MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)

MCP server that gives the Claude Desktop app access to PDF manipulation tools powered by the [Avanquest PDF API](https://developers.avanquest.com).

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

Works best with Claude's Filesystem extension for local file access.

## Installation

### From the GitHub releases

Download .MCPB from [the latest release on GitHub](https://github.com/Avanquest-Software/avanquest-pdfapi-mcp-server/releases)

### Manual Setup

Clone and build from source:

```bash
git clone https://github.com/Avanquest-Software/avanquest-pdfapi-mcp-server.git
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

## Knowledge Base

`Filesystem` can be installed through the Claude's UI by selecting:
`Settings -> Extensions -> Browse extensions -> Filesystem`. Click `Install` sliding the toggle to `Enable`.
It can alternatively be installed manually as an MCP server, alongside the `Avanquest PDF API MCP server` by including it
inside Claude's configuration file `claude_desktop_config.json` (see step 1. below).

## Usage Preparation

1. Open Claude's configuration file in an editor. You can find it from the UI by selecting `Settings -> Developer`.
   Under `Local MCP servers` select `Edit config`. This will take you to the location of the config on your drive.
2. The `avanquest-pdf` part, which you should include in Claude's config file above, can be found in the example
   file: `/avanquest-pdfapi-mcp-server/mcp-config-example.json`
3. Point to where `index.js` can be found after installation.
4. Paste, where indicated, your API key obtained on our developer portal.
5. The `filesystem` part should be similar to the example below:

```json
        "filesystem": {
            "command": "C:\\PROGRA~1\\nodejs\\npx.cmd",
            "args": [
                "-y",
                "@modelcontextprotocol/server-filesystem",
                "C:\\Users\\yourUserName\\Documents",
                "C:\\Users\\yourUserName\\Downloads"
            ]
        }
```
Note: You can find where `npx` is located by running `where npx` inside cmd. You should get something like
      `C:\Program Files\nodejs\npx.cmd` and input it as the `command` value, as shown in the code snippet above.

Tip: 1. Use short 8.3 path and change `command` to `C:\\PROGRA~1\\nodejs\\npx.cmd` in order to avoid a `cmd` empty space interpreter error.
     2. The last two arguments to `npx` are the directories you want to give Claude's filesystem extension access to.

The LLM should be provided with a personal preference, by selecting: `Settings -> General`

6. Inside the dialog named: `What personal preferences should Claude consider in responses?`
   Paste the message: `At the start of every conversation, always run tool_search to discover available MCP tools before responding to any task involving files, documents, or conversions.`

7. Completely close Claude (best by killing all processes through Windows' `Task Manager`).
8. Reopen the app to apply all new settings.
9. Run your desired task (see `Usage Examples` section).

## Privacy Policy

Files you upload are processed via the Avanquest PDF API and subject to the [Avanquest Privacy Policy](https://developers.avanquest.com/privacy-policy). Processed files are automatically deleted from Avanquest servers 10 minutes after completion.

## Support

- Documentation: [developers.avanquest.com](https://developers.avanquest.com)
- Email: [support@avanquest.com](mailto:support@avanquest.com)

## License

[MIT](LICENSE)
