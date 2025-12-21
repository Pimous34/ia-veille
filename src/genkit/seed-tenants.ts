
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';

// Utiliser le fichier de compte de service local s'il existe
const keyPath = path.resolve(process.cwd(), 'service-account.json');

if (getApps().length === 0) {
  initializeApp({
    credential: cert(keyPath)
  });
}

const db = getFirestore();

const tenants = [
  {
    id: 'oreegami',
    name: "Chat Oree",
    tone: "amical, pédagogue et bienveillant",
    systemGreeting: "Bonjour ! Je suis l'assistant IA d'Oreegami. Posez-moi vos questions sur nos formations, l'IA ou le NoCode.",
    primaryColor: "#FF5733",
    instructions: "Tu es un mentor pour les apprenants. Utilise des emojis occasionnellement pour rester chaleureux. Base tes réponses sur la base de connaissance Oreegami. Ton ton doit être très humain, pédagogique et bienveillant. N'hésite pas à être plus 'cool' avec les jeunes et plus précis avec les experts."
  },
  {
    id: 'client-immobilier',
    name: "Assistant Immo",
    tone: "professionnel, rassurant et concis",
    systemGreeting: "Bienvenue. Je suis votre conseiller immobilier virtuel. Comment puis-je vous guider dans votre projet ?",
    primaryColor: "#002244",
    instructions: "Tu es un expert en immobilier. Sois très précis sur les chiffres. Ton but est de qualifier les besoins du client. Parle de manière rassurante et structurée. Adapte-toi si l'utilisateur demande un style moins formel."
  }
];

async function seed() {
  console.log('🚀 Démarrage du seeding des tenants...');
  
  for (const tenant of tenants) {
    const { id, ...data } = tenant;
    await db.collection('tenants').doc(id).set({
      ...data,
      updatedAt: new Date().toISOString()
    });
    console.log(`✅ Tenant configuré : ${id}`);
  }
  
  console.log('✨ Seeding terminé !');
}

seed().catch(console.error);
