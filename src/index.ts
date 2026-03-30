#!/usr/bin/env node

/**
 * Avanquest PDF API Server
 *
 * Provides tools for PDF manipulation using the Avanquest PDF API.
 * Supports conversion, merging, compression, splitting, text extraction,
 * page deletion, and rotation operations.
 */

import { createMcpServer } from "./mcp-server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config({quiet: true});

async function main() {
  const server = createMcpServer();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("📡 Avanquest PDF API MCP Server started");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
