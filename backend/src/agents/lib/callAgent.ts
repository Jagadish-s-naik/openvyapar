import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CallAgentOptions<T> {
  promptFile: string;
  userInput: unknown;
  fallback: () => T;
}

// In-Memory Short-Term Response Cache (prevents duplicate calls within 60s from burning tokens)
interface CacheEntry {
  response: unknown;
  timestamp: number;
}
const agentCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

function getCacheKey(promptFile: string, userInput: unknown): string {
  const content = `${promptFile}:${typeof userInput === 'string' ? userInput : JSON.stringify(userInput)}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Shared helper to load system prompt from prompts/ directory.
 */
export function loadPrompt(filename: string): string {
  try {
    const possiblePaths = [
      path.resolve(__dirname, '../../../prompts', filename),
      path.resolve(__dirname, '../../prompts', filename),
      path.resolve(__dirname, '../prompts', filename),
      path.resolve(process.cwd(), 'prompts', filename),
      path.resolve(process.cwd(), 'backend/prompts', filename),
      path.resolve(process.cwd(), 'agent-service/prompts', filename),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, 'utf-8');
      }
    }
  } catch (err) {
    console.warn(`[callAgent] Could not read prompt file ${filename} from disk:`, err);
  }
  return '';
}

/**
 * Executes chat completion request against specified model
 */
async function fetchChatCompletion(
  baseUrl: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userContent: string
): Promise<{ ok: boolean; status: number; text?: string; json?: unknown }> {
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: systemPrompt || 'You are an AI assistant in OpenVyapar. Return your output strictly as a JSON object.',
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { ok: false, status: response.status, text: errText };
    }

    const data = await response.json();
    return { ok: true, status: response.status, json: data };
  } catch (err) {
    return { ok: false, status: 500, text: (err as Error).message };
  }
}

/**
 * Shared LLM Caller (Supports Groq & OpenAI natively with multi-model cascade and in-memory caching)
 */
export async function callAgent<T>(options: CallAgentOptions<T>): Promise<T> {
  const groqKey = process.env.GROQ_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  const isGroq = Boolean(groqKey || (openAiKey && openAiKey.startsWith('gsk_')));
  const apiKey = groqKey || openAiKey;

  if (!apiKey) {
    // Offline / demo fallback mode
    return options.fallback();
  }

  // Check in-memory cache first
  const cacheKey = getCacheKey(options.promptFile, options.userInput);
  const cached = agentCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.response as T;
  }

  const systemPrompt = loadPrompt(options.promptFile);
  const userContent = typeof options.userInput === 'string'
    ? options.userInput
    : JSON.stringify(options.userInput, null, 2);

  const baseUrl = process.env.OPENAI_BASE_URL || (isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions');

  // Multi-tier model cascade
  const configuredModel = process.env.GROQ_MODEL || process.env.OPENAI_MODEL;
  const candidateModels = isGroq
    ? [configuredModel || 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-120b'].filter(Boolean)
    : [configuredModel || 'gpt-4o-mini', 'gpt-3.5-turbo'].filter(Boolean);

  for (const model of candidateModels) {
    const result = await fetchChatCompletion(baseUrl, apiKey, model, systemPrompt, userContent);

    if (result.ok && result.json) {
      interface OpenAIChatCompletion {
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
      }
      const data = result.json as OpenAIChatCompletion;
      const content = data?.choices?.[0]?.message?.content;
      if (content) {
        try {
          const parsed = JSON.parse(content) as T;
          // Save to cache
          agentCache.set(cacheKey, { response: parsed, timestamp: Date.now() });
          return parsed;
        } catch {
          // If JSON parse fails, try next model or fallback
        }
      }
    } else {
      console.warn(`[callAgent] Model ${model} request returned status ${result.status}.`);
      if (result.status === 429) {
        // Continue to secondary lighter candidate model
        continue;
      }
    }
  }

  // Graceful fallback to deterministic engine
  const fallbackResult = options.fallback();
  agentCache.set(cacheKey, { response: fallbackResult, timestamp: Date.now() });
  return fallbackResult;
}
