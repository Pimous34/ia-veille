
import { ai } from './ai';
import { chatWithDocuments } from './chat';

async function main() {
  try {
    const question = "Quels sont les avantages du contrat pro ?";
    
    console.log(`\n=== TEST 1: Tenant 'oreegami' (Should find docs) ===`);
    const answer1 = await chatWithDocuments({
      question: question,
      history: [],
      tenantId: 'oreegami'
    });
    console.log('Answer 1 Length:', answer1.length);
    console.log('Contains source?', answer1.includes('[Source:') || answer1.includes('[Fichier:'));

    console.log(`\n=== TEST 2: Tenant 'spy-corp' (Should NOT find docs) ===`);
    const answer2 = await chatWithDocuments({
      question: question,
      history: [],
      tenantId: 'spy-corp'
    });
    console.log('Answer 2 Length:', answer2.length);
    console.log('Contains source?', answer2.includes('[Source:') || answer2.includes('[Fichier:'));
    
    if (answer1.length > 200 && !answer2.includes('[Source:')) {
        console.log('\n✅ SUCCESS: Isolation works! SpyCorp saw nothing.');
    } else {
        console.log('\n❌ FAILURE: Isolation failed or no answers.');
    }
    
  } catch (error) {
    console.error('Error in chat flow:', error);
  }
}

main();
