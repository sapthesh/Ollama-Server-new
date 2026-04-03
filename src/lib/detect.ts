import {
  TEST_PROMPTS,
  ModelInfo,
  fetchWithTimeout,
  checkService as checkServiceUtil,
  isFakeOllama,
  estimateTokens,
  generateRequestBody,
  isValidTPS
} from './ollama-utils';

const TEST_ROUNDS = 3; // Number of test rounds

// Export checkService function
export const checkService = checkServiceUtil;

// Measure service performance
export async function measureTPS(url: string, model: ModelInfo): Promise<number | { isFake: true }> {
  try {
    let totalTokens = 0;
    let totalTime = 0;
    let isFake = false;
    let abnormalTpsDetected = false;

    // Multi-round test
    for (let i = 0; i < TEST_ROUNDS; i++) {
      const prompt = TEST_PROMPTS[i % TEST_PROMPTS.length];

      const response = await fetchWithTimeout(`${url}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generateRequestBody(model.name, prompt, false)),
      });

      if (!response.ok) {
        console.error(`Round ${i + 1} test failed:`, await response.text());
        continue;
      }

      const data = await response.json();

      // Check if it's fake-ollama
      if (isFakeOllama(data.response)) {
        console.log(`Detected fake-ollama: ${url}`);
        isFake = true;
        break;
      }

      // Use eval_count and eval_duration returned by the API to calculate TPS
      if (data.eval_count && data.eval_duration) {
        const rawTps = (data.eval_count / data.eval_duration) * 1e9;
        
        // Check if TPS is abnormal
        if (!isValidTPS(rawTps)) {
          console.warn(`Detected abnormal TPS value: ${rawTps.toFixed(2)} from server: ${url}`);
          abnormalTpsDetected = true;
          // Continue testing other rounds to collect more data
        }
        
        totalTokens += data.eval_count;
        totalTime += data.eval_duration / 1e9; // Convert to seconds
      } else {
        // If the API does not return these fields, use the estimation method
        const inputTokens = estimateTokens(prompt);
        const outputTokens = estimateTokens(data.response);
        const timeInSeconds = data.total_duration ? data.total_duration / 1e9 : 1; // Use total_duration if available
        
        totalTokens += (inputTokens + outputTokens);
        totalTime += timeInSeconds;
      }

      // Wait a short time before the next round of testing
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // If it's fake or abnormal TPS is detected, return a special flag
    if (isFake || abnormalTpsDetected) {
      return { isFake: true };
    }

    // Calculate average TPS
    const averageTps = totalTime > 0 ? totalTokens / totalTime : 0;
    
    // Check average TPS one last time
    if (!isValidTPS(averageTps)) {
      console.warn(`Final calculated average TPS abnormal: ${averageTps.toFixed(2)} from server: ${url}`);
      return { isFake: true };
    }
    
    return averageTps;
  } catch (error) {
    console.error('Measure TPS failed:', error);
    return 0;
  }
} 