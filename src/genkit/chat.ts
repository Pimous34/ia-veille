
import { ai } from './ai';
import { z } from 'genkit';
import { getFirestore, QueryDocumentSnapshot } from 'firebase-admin/firestore'; 
import { initializeApp, getApps } from 'firebase-admin/app';

// Initialize Firebase Admin if not already done
if (getApps().length === 0) {
  try {
    initializeApp();
    console.log('Firebase Admin initialized successfully');
  } catch (err) {
    console.error('Firebase Admin initialization error:', err);
  }
}


// Helper for embedding with retry logic
async function embedWithRetry(content: string, embedder: string, taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT', retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.embed({
        embedder,
        content,
        options: { taskType }
      });
    } catch (err: any) {
      if (i === retries - 1) throw err;
      const is500 = err.message?.includes('500') || err.stack?.includes('500');
      if (is500) {
        console.warn(`[Retry ${i + 1}/${retries}] Embedding failed with 500, retrying in 1s...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        throw err;
      }
    }
  }
}

export const chatWithDocuments = ai.defineFlow(
  {
    name: 'chatWithDocuments',
    inputSchema: z.object({
      question: z.string(),
      history: z.array(z.object({ role: z.enum(['user', 'model']), content: z.array(z.object({ text: z.string() })) })).optional(),
      tenantId: z.string().default('oreegami'),
      userData: z.object({
        age: z.number().optional(),
        experience_level: z.string().optional(),
        user_type: z.string().optional(),
      }).optional(),
    }),
    outputSchema: z.string(),
  },
  async ({ question, history, tenantId, userData }) => {
    const db = getFirestore();
    
    // 0. Fetch Tenant Configuration
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    const config = tenantDoc.data() || {
      name: "Chat Oree",
      tone: "amical, pédagogue et bienveillant",
      instructions: "Tu es un mentor pour les apprenants. Ton ton est humain et naturel."
    };

    // --- Dynamic Tone Resolution ---
    let resolvedTone = config.tone;
    const age = userData?.age;
    const level = userData?.experience_level;

    if (age && age < 25) {
      resolvedTone += ", dynamique, moderne (utilise quelques emojis et un langage accessible)";
    } else if (level === 'pro' || userData?.user_type === 'professionnel') {
      resolvedTone += ", expert, structuré et très précis";
    }

    const toneInstructions = `Ton style de base est : ${resolvedTone}. 
    RÈGLE DE SOUPLESSE : Ton ton doit rester cohérent avec ce style, MAIS si l'utilisateur te demande explicitement de changer de registre (ex: 'parle-moi plus rigoureusement', 'fais-moi une blague', 'sois plus humain'), ADAPTE-TOI avec bienveillance à sa demande spécifique pour cet échange.`;

    // 1. Embed the user's question with the SAME model as ingestion
    // Note: We use the string ID for the embedder here as we don't need the object for embed()
    // but we MUST ensure it matches ingest.ts (googleai/text-embedding-004)
    const embedding = await embedWithRetry(question, 'googleai/text-embedding-004', 'RETRIEVAL_QUERY');

    // 2. Perform Firestore Vector Search (Native)
    // This requires the vector index to be enabled (firestore.indexes.json)
    const coll = db.collection('documents');
    
    // Fix: ai.embed returns [{ embedding: [...] }]
    // we need to extract the actual vector (array of objects -> object -> valid vector)
    const vector = (embedding as any)[0].embedding;
    
    // findNearest(vectorField, queryVector, options)
    // Filter by tenantId BEFORE vector search for security and relevance
    const vectorQuery = coll.where('metadata.tenantId', '==', tenantId).findNearest('embedding', vector, {
      limit: 5,
      distanceMeasure: 'COSINE',
    });

    const docsSnapshot = await vectorQuery.get();

    const topDocs = docsSnapshot.docs.map((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        content: data.text || data.content || '',
        sourceUrl: data.metadata?.sourceUrl || data.metadata?.source || null,
        fileName: data.metadata?.fileName || null
      };
    });

    const context = topDocs.map((d: { content: string, sourceUrl: string | null, fileName: string | null }) => {
      const sourceInfo = d.sourceUrl ? `[Source: ${d.sourceUrl}]` : (d.fileName ? `[Fichier: ${d.fileName}]` : '');
      return `${sourceInfo}\n${d.content}`;
    }).join('\n\n---\n\n');

    // 3. Generate the answer with Gemini
    const response = await ai.generate({
      // Use Google AI
      model: 'googleai/gemini-2.0-flash',
      prompt: `Tu es l'assistant nommé "${config.name}".
TON : ${toneInstructions}
INSTRUCTIONS SPÉCIFIQUES : ${config.instructions}

PERSONA GÉNÉRAL :
Tu es l'assistant conseiller pour les utilisateurs de l'organisme ou entreprise liée au tenant "${tenantId}".
Ta mission est d'accompagner l'utilisateur, répondre à ses questions sur les documents fournis ou sur l'organisation.

[Règles strictes]
- Adopte un ton HUMAIN, NATUREL et bienveillant.
- Sois concis et direct.
- NE COMMENCE JAMAIS tes phrases par "En tant qu'assistant..." ou "Je suis l'assistant...". C'est interdit.
- Parle comme un collaborateur ou un mentor bienveillant.

Règles de réponse :
1. Base tes réponses PRIORITAIREMENT sur le CONTEXTE RAG fourni ci-dessous.
2. Si l'information n'est pas dans le contexte RAG, utilise ta connaissance générale pour répondre intelligemment tout en restant dans ton rôle.
3. Si la question concerne ton identité, réponds selon ton nom configuré : ${config.name}.
4. Si l'information n'est NI dans le contexte, NI dans ta base de connaissance, dis simplement : "Désolé, je ne trouve pas cette information précise pour le moment."
5. CITE TES SOURCES [OPTIONNEL] :
   - Ajoute une ligne "[Source: URL]" à la fin UNIQUEMENT SI l'URL n'est PAS DÉJÀ dans ta réponse.
   - SI tu as déjà donné le lien dans la phrase, NE RIEN AJOUTER à la fin.
   - Si tu ajoutes la source, fais-le avec un saut de ligne :
     [Source: URL]

CONTEXTE RAG :
${context}

QUESTION : ${question}`,
      history: history as Array<{ role: 'user' | 'model'; content: Array<{ text: string }> }>, 
    });

    return response.text;
  }
);
