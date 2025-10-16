import { Router } from "express";
import { extractProxy } from "./routes/extract-content.js";
import { applyProxy } from "./routes/apply-rewrite.js";

const router = Router();

// No-store tegen caching van probes
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// 🔎 Log elk MCP-verzoek (methode + pad)
router.use((req, _res, next) => {
  console.log('[MCP]', req.method, req.path);
  next();
});

/**
 * Compatibele probes — sommige clients doen HEAD/OPTIONS/POST op de base route
 */
router.head("/", (req, res) => res.status(200).end());
router.options("*", (req, res) => {
  res.set({
    "Allow": "GET,POST,HEAD,OPTIONS",
    "Content-Type": "application/json"
  });
  res.status(200).end();
});

// Reageer ook op POST /mcp zelf (soms geprobeerd door clients)
router.post("/", (req, res) => {
  res.json({ ok: true, endpoints: ["/tools/list", "/tools/call"] });
});

/**
 * Basispad voor health/probe (GET)
 */
router.get("/", (req, res) => {
  res.json({ ok: true, endpoints: ["/tools/list", "/tools/call"] });
});

/**
 * (Optioneel) GET-variant om eenvoudig in de browser te testen
 */
router.get("/tools/list", (req, res) => {
  res.json({
    tools: [
      {
        name: "extract_content",
        description: "Leest inhoud + meta voor een WordPress post_id.",
        input_schema: {
          type: "object",
          properties: {
            post_id: { type: "number", minimum: 1 }
          },
          required: ["post_id"],
          additionalProperties: false
        },
        annotations: { readOnlyHint: true }
      },
      {
        name: "apply_rewrite",
        description: "Schrijft SEO-title en meta description weg naar WordPress.",
        input_schema: {
          type: "object",
          properties: {
            post_id: { type: "number", minimum: 1 },
            title: { type: "string", maxLength: 120 },
            description: { type: "string", maxLength: 200 }
          },
          required: ["post_id"],
          additionalProperties: false
        }
      }
    ]
  });
});

/**
 * Geeft tool-definities terug aan ChatGPT (MCP) — officiële POST-route
 */
router.post("/tools/list", (req, res) => {
  res.json({
    tools: [
      {
        name: "extract_content",
        description: "Leest inhoud + meta voor een WordPress post_id.",
        input_schema: {
          type: "object",
          properties: {
            post_id: { type: "number", minimum: 1 }
          },
          required: ["post_id"],
          additionalProperties: false
        },
        annotations: { readOnlyHint: true }
      },
      {
        name: "apply_rewrite",
        description: "Schrijft SEO-title en meta description weg naar WordPress.",
        input_schema: {
          type: "object",
          properties: {
            post_id: { type: "number", minimum: 1 },
            title: { type: "string", maxLength: 120 },
            description: { type: "string", maxLength: 200 }
          },
          required: ["post_id"],
          additionalProperties: false
        }
      }
    ]
  });
});

/**
 * Voert een tool-call uit
 */
router.post("/tools/call", async (req, res) => {
  try {
    const { name, arguments: args } = req.body || {};
    if (!name) return res.status(400).json({ error: "tool_name_required" });

    if (name === "extract_content") {
      if (!args || typeof args.post_id !== "number") {
        return res.status(400).json({ error: "bad_arguments" });
      }
      const result = await extractProxy(args.post_id);
      return res.json({
        content: JSON.stringify(result),
        mime_type: "application/json"
      });
    }

    if (name === "apply_rewrite") {
      if (!args || typeof args.post_id !== "number") {
        return res.status(400).json({ error: "bad_arguments" });
      }
      const payload = { post_id: args.post_id, edits: [], meta: {} };
      if (typeof args.title === "string") payload.meta.title = args.title;
      if (typeof args.description === "string") payload.meta.description = args.description;

      const result = await applyProxy(payload);
      return res.json({
        content: JSON.stringify(result),
        mime_type: "application/json"
      });
    }

    return res.status(404).json({ error: "unknown_tool", name });
  } catch (e) {
    console.error("[mcp/tools/call]", e);
    return res.status(500).json({ error: "mcp_call_failed", detail: String(e) });
  }
});

// ✅ Catch-all binnen /mcp om onbekende paden/methodes zichtbaar te maken
router.all("*", (req, res) => {
  res.status(404).json({
    error: "unknown_mcp_route",
    method: req.method,
    path: req.path,
    expected: ["/", "/tools/list", "/tools/call"]
  });
});

export const mcpRouter = router;
export default router;
