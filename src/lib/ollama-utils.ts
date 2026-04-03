/**
* Ollama utility library
* Provides common functions for interacting with the Ollama API
*/

// Timeout settings
export const TIMEOUT_MS = 30000; // 30 seconds timeout

// Test prompt word
export const TEST_PROMPTS = [
  "Tell me a short story about a robot who learns to love.",
  "Explain the concept of recursion in programming.",
  "What are the main differences between classical and quantum computing?"
];

// Define the interface for model information
export interface ModelInfo {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

// Create a fetch function with a timeout
export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Check service availability and get a list of models
export async function checkService(url: string): Promise<ModelInfo[] | null> {
  try {
    const response = await fetchWithTimeout(`${url}/api/tags`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`Service returns non-200 status code: ${url}, status code:${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error('Check service failed:', error);
    return null;
  }
}

// Check if TPS is within a reasonable range
export function isValidTPS(tps: number): boolean {
// A normal Ollama service TPS is typically between 0.1 and 100
// High-performance servers may reach 200-300 TPS
// TPS values ​​over 1000 are generally unreasonable
const MIN_VALID_TPS = 0.01; // Minimum valid TPS
const MAX_VALID_TPS = 1000; // Maximum valid TPS
  
  return tps >= MIN_VALID_TPS && tps <= MAX_VALID_TPS;
}

// Check if it's fake-ollama
export function isFakeOllama(response: string): boolean {
return response.includes('fake-ollama') ||
response.includes('This is a message from') ||
response.includes('Canonical reply');
}

// Estimate the number of tokens in a text
export function estimateTokens(text: string): number {
// This is a simple estimate; the actual number of tokens may vary.
// 1. Split words by whitespace
const words = text.split(/\s+/);
// 2. Consider punctuation
const punctuation = text.match(/[.,!?;:'"()\[\]{}]/g)?.length || 0;
// 3. Consider numbers
const numbers = text.match(/\d+/g)?.length || 0;

return words.length + punctuation + numbers;
}

// Generate test request body
export function generateRequestBody(model: string, prompt: string, stream = false) {
  return {
    model,
    prompt,
    stream,
    options: {
      temperature: 0.7,
      top_p: 0.9,
      top_k: 40,
    }
  };
}

// Calculate TPS (Tokens Per Second)
export function calculateTPS(data: { eval_count: number, eval_duration: number }): number {
// Calculate TPS using eval_count and eval_duration returned by the API
if (data.eval_count && data.eval_duration) {
// eval_duration is in nanoseconds, calculate: eval_count / eval_duration * 10^9
const tps = (data.eval_count / data.eval_duration) * 1e9;

// Check if TPS is within a reasonable range
if (!isValidTPS(tps)) {
console.warn(`Abnormal TPS value detected: ${tps.toFixed(2)}`);
// If TPS is unreasonable, return a reasonable default value
return 0;
}

return tps;
}

// If these fields are missing, return 0
return 0;
}
