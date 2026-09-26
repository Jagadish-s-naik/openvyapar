import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CallAgentOptions<T> {
  promptFile: string;
  userInput: unknown;
  fallback: () => T;
}

/**
 * Shared helper to load system prompt from prompts/ directory.
 */
export function loadPrompt(filename: string): string {
  try {
    // Look up prompts relative to dist/ or src/
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
 * Shared OpenAI LLM Caller
 * - Calls https://api.openai.com/v1/chat/completions
 * - Sets response_format: { type: "json_object" }
 * - Uses process.env.OPENAI_MODEL || "gpt-4o-mini"
 * - Gracefully falls back to deterministic heuristic logic if no API key or if API call fails
 */
export async function callAgent<T>(options: CallAgentOptions<T>): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    // Offline / demo fallback mode
    return options.fallback();
  }

  const systemPrompt = loadPrompt(options.promptFile);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: typeof options.userInput === 'string'
              ? options.userInput
              : JSON.stringify(options.userInput, null, 2),
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[callAgent] OpenAI API request failed (${response.status}): ${errText}. Falling back to deterministic engine.`);
      return options.fallback();
    }

    interface OpenAIChatCompletion {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    }

    const data = (await response.json()) as OpenAIChatCompletion;
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.warn('[callAgent] Empty response content from OpenAI. Falling back to deterministic engine.');
      return options.fallback();
    }

    const parsed = JSON.parse(content);
    return parsed as T;
  } catch (err) {
    console.warn('[callAgent] Error calling OpenAI API. Falling back to deterministic engine:', err);
    return options.fallback();
  }
}
