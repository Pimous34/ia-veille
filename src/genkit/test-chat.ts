
import { ai } from './ai';
import { chatWithDocuments } from './chat';

async function main() {
  try {
    const question = "Quels sont les avantages du contrat pro ?";
    console.log(`Asking question: "${question}"`);
    
    const answer = await chatWithDocuments({
      question: question,
      history: []
    });
    
    console.log('\n--- Answer ---');
    console.log(answer);
    console.log('--------------\n');
    
  } catch (error) {
    console.error('Error in chat flow:', error);
  }
}

main();
