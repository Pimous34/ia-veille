
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';

const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
});

async function main() {
  console.log('Using API Key:', process.env.GOOGLE_GENAI_API_KEY ? '***' : 'MISSING');
  // There isn't a direct "listModels" in the high-level Genkit wrapper easily accessible here 
  // without digging into the plugin internals or using the raw SDK.
  // So we will use the raw Google Generative AI SDK which Genkit uses under the hood.
  
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || '');
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('Attempting to access gemini-1.5-flash...');
    // We can't list models easily with just the client instance in this version, 
    // but we can try a simple count tokens to see if the model exists.
    const result = await model.countTokens('Hello');
    console.log('Success! gemini-1.5-flash is accessible. Token count:', result.totalTokens);
  } catch (error) {
    console.error('Error accessing gemini-1.5-flash:', error.message);
  }

    try {
    const modelPro = genAI.getGenerativeModel({ model: 'gemini-pro' });
    console.log('Attempting to access gemini-pro...');
    const result = await modelPro.countTokens('Hello');
    console.log('Success! gemini-pro is accessible. Token count:', result.totalTokens);
  } catch (error) {
    console.error('Error accessing gemini-pro:', error.message);
  }
}

main();
