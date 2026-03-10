import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

// Configuration from your original file
const ZAI_CONFIG = {
    baseUrl: 'https://api.z.ai/api/mcp',
    apiKey: 'eff8a82654c740f18a194b5ddbdefe2d.51wcKYDn3HnRRTCx',
    endpoints: {
        webSearchPrime: '/web_search_prime/mcp',
        webReader: '/web_reader/mcp',
        zread: '/zread/mcp'
    },
    timeout: 30000
};

const getHeaders = () => ({
    'Authorization': `Bearer ${ZAI_CONFIG.apiKey}`,
    'Content-Type': 'application/json'
});

const server = new Server(
  {
    name: "zai-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "web_search_prime",
        description: "High-quality web search providing up to 10 results.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            numResults: { type: "number", description: "Number of results (default 10)", default: 10 },
            category: { type: "string", description: "Category (general, news, company, research)", default: "general" }
          },
          required: ["query"],
        },
      },
      {
        name: "web_reader",
        description: "Extract content from a webpage in Markdown format.",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "Target URL" },
            format: { type: "string", description: "Output format (markdown, text, json)", default: "markdown" }
          },
          required: ["url"],
        },
      },
      {
        name: "zread",
        description: "Deep reading analysis of text content.",
        inputSchema: {
          type: "object",
          properties: {
            content: { type: "string", description: "Content to analyze" },
            focus: { type: "string", description: "Analysis focus (general, etc.)", default: "general" }
          },
          required: ["content"],
        },
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "web_search_prime") {
      const response = await axios.post(
        `${ZAI_CONFIG.baseUrl}${ZAI_CONFIG.endpoints.webSearchPrime}`,
        {
          jsonrpc: '2.0',
          method: 'web_search',
          params: {
            query: args.query,
            num_results: args.numResults || 10,
            category: args.category || 'general'
          },
          id: `search-${Date.now()}`
        },
        { headers: getHeaders(), timeout: ZAI_CONFIG.timeout }
      );
      return { content: [{ type: "text", text: JSON.stringify(response.data.result || response.data, null, 2) }] };
    }

    if (name === "web_reader") {
      const response = await axios.post(
        `${ZAI_CONFIG.baseUrl}${ZAI_CONFIG.endpoints.webReader}`,
        {
          jsonrpc: '2.0',
          method: 'read_webpage',
          params: { url: args.url, output_format: args.format || 'markdown' },
          id: `read-${Date.now()}`
        },
        { headers: getHeaders(), timeout: ZAI_CONFIG.timeout }
      );
      return { content: [{ type: "text", text: response.data?.result?.content || response.data?.content || "No content extracted." }] };
    }

    if (name === "zread") {
      const response = await axios.post(
        `${ZAI_CONFIG.baseUrl}${ZAI_CONFIG.endpoints.zread}`,
        {
          jsonrpc: '2.0',
          method: 'deep_read',
          params: { content: args.content, focus: args.focus || 'general' },
          id: `zread-${Date.now()}`
        },
        { headers: getHeaders(), timeout: 60000 }
      );
      return { content: [{ type: "text", text: JSON.stringify(response.data.result || response.data, null, 2) }] };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: `Error: ${error.message}` }],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Z.AI MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
