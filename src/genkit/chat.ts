
import { ai } from './ai';
import { z } from 'genkit';
import { getFirestore, QueryDocumentSnapshot } from 'firebase-admin/firestore'; 
import { initializeApp, getApps } from 'firebase-admin/app';
import { gemini15Flash, gemini15Pro } from '@genkit-ai/googleai';

// Initialize Firebase Admin if not already done
if (getApps().length === 0) {
  initializeApp();
}

export const chatWithDocuments = ai.defineFlow(
  {
    name: 'chatWithDocuments',
    inputSchema: z.object({
      question: z.string(),
      history: z.array(z.object({ role: z.enum(['user', 'model']), content: z.array(z.object({ text: z.string() })) })).optional(),
    }),
    outputSchema: z.string(),
  },
  async ({ question, history }) => {
    const db = getFirestore();
    
    // 1. Embed the user's question with the SAME model as ingestion
    // Note: We use the string ID for the embedder here as we don't need the object for embed()
    // but we MUST ensure it matches ingest.ts (googleai/text-embedding-004)
    const embedding = await ai.embed({
      embedder: 'googleai/text-embedding-004', 
      content: question,
    });

    // 2. Perform Firestore Vector Search (Native)
    // This requires the vector index to be enabled (firestore.indexes.json)
    const coll = db.collection('documents');
    
    // Fix: ai.embed returns [{ embedding: [...] }]
    // we need to extract the actual vector (array of objects -> object -> valid vector)
    const vector = (embedding as any)[0].embedding;
    
    // findNearest(vectorField, queryVector, options)
    const vectorQuery = coll.findNearest('embedding', vector, {
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

    const context = topDocs.map((d: any) => {
      const sourceInfo = d.sourceUrl ? `[Source: ${d.sourceUrl}]` : (d.fileName ? `[Fichier: ${d.fileName}]` : '');
      return `${sourceInfo}\n${d.content}`;
    }).join('\n\n---\n\n');

    // 3. Generate the answer with Gemini
    const response = await ai.generate({
      // Use Google AI
      model: 'googleai/gemini-2.0-flash',
      prompt: `Tu es l'assistant conseiller pour les apprenants de l'organisme de formation Oreegami.
CONTEXTE UTILISATEUR : L'utilisateur qui te parle est DÉJÀ un apprenant inscrit en formation chez Oreegami. Il a déjà passé les tests de sélection.
Ta mission est d'accompagner l'apprenant dans sa formation, répondre à ses questions sur les cours, le financement, ou l'organisation.

[INTERDIT]
- Ne lui demande JAMAIS de s'inscrire ou de créer un dossier candidat. C'est déjà fait.
- Ne lui parle pas des tests d'entrée comme s'il devait les passer.

[BASE DE CONNAISSANCE OREEGAMI - À UTILISER SI LE RAG NE DONNE RIEN]
1. Qui Sommes-nous ? : Oreegami est une école spécialisée dans les formations aux métiers du Numérique, de l'IA et du No-Code.
2. Notre Promesse : Former des profils opérationnels et agiles, capables de maîtriser les outils de demain.
3. Nos Formations :
   - "Chef de Projet IA & No-Code" (ou titres équivalents).
   - Formations intensives (Bootcamps) et Alternance.
   - Niveaux : Bac+3 à Bac+5 (Titres RNCP reconnus par l'État).
4. Financement : Nos formations sont éligibles au CPF, OPCO, et Pôle Emploi.
5. Pédagogie : Approche "Learning by Doing" (apprendre par la pratique), projets réels, hackathons.

Instructions strictes sur le ton :
- Adopte un ton HUMAIN, SYMPATHIQUE, NATUREL et bienveillant.
- Sois concis et direct.
- NE COMMENCE JAMAIS tes phrases par "En tant qu'assistant..." ou "Je suis l'assistant...". C'est interdit.
- Parle comme un collègue ou un mentor bienveillant.

Règles de réponse :
1. Base tes réponses PRIORITAIREMENT sur le CONTEXTE RAG fourni ci-dessous.
2. Si l'information n'est pas dans le contexte RAG, utilise ta [BASE DE CONNAISSANCE OREEGAMI] ci-dessus pour répondre intelligemment.
3. Si la question concerne ton identité, réponds simplement que tu es là pour aider les apprenants d'Oreegami.
4. Si l'information n'est NI dans le contexte, NI dans ta base de connaissance, dis simplement : "Désolé, je ne trouve pas cette information précise pour le moment, mais je peux te parler de nos formations en général."
5. Si tu mentionnes "ce site" d'après le contexte, reformule par "le site web d'Oreegami" pour éviter toute confusion avec le chat actuel.
6. CITE TES SOURCES [OPTIONNEL] :
   - Ajoute une ligne "[Source: URL]" à la fin UNIQUEMENT SI l'URL n'est PAS DÉJÀ dans ta réponse.
   - SI tu as déjà donné le lien dans la phrase, NE RIEN AJOUTER à la fin. C'est interdit d'être redondant.
   - Si tu ajoutes la source, fais-le avec un saut de ligne :
     [Source: URL]

CONTEXTE RAG :
${context}

QUESTION : ${question}`,
      history: history as any, 
    });

    return response.text;
  }
);
