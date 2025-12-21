
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listModels() {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    console.error('Error: GOOGLE_GENAI_API_KEY is not set in .env.local');
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  console.log('Fetching models from:', url.replace(apiKey, '***'));
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP Error: ${response.status} ${response.statusText}`);
        console.error('Response Body:', errorText);
        return;
    }

    const data = await response.json();
    console.log('Available Models:');
    if (data.models) {
        data.models.forEach((m: any) => console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods?.join(', ')})`));
    } else {
        console.log('No models returned in response:', data);
    }

  } catch (error) {
    console.error('Fetch error:', error);
  }
}

listModels();
