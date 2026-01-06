
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

const cards = [
  // --- 🗣️ JARGON STARTUP & TECH GENERAL (20) ---
  { category: 'Vocabulaire & Jargon', front: 'Que veut dire "Scalabilité" (Scalability) ?', back: 'La capacité d\'un système (ou business) à encaisser une forte croissance (x10, x100 utilisateurs) sans s\'effondrer ni coûter une fortune.', tags: ['jargon', 'business'] },
  { category: 'Vocabulaire & Jargon', front: 'Que veut dire "Bootstrap" ?', back: 'Lancer et développer sa boîte avec ses fonds propres, sans lever d\'argent auprès d\'investisseurs.', tags: ['jargon', 'startup'] },
  { category: 'Vocabulaire & Jargon', front: 'Que veut dire "Pivot" ?', back: 'Changer radicalement de stratégie ou de produit après avoir réalisé que l\'idée initiale ne marchait pas.', tags: ['jargon', 'startup'] },
  { category: 'Vocabulaire & Jargon', front: 'Que veut dire "Time to Market" (TTM) ?', back: 'Le temps écoulé entre l\'idée et la mise en vente réelle du produit. En startup, on cherche à le réduire au max.', tags: ['jargon', 'product'] },
  { category: 'Vocabulaire & Jargon', front: 'Que veut dire "Pain Point" ?', back: 'Un problème irritant ou une souffrance spécifique du client que votre produit doit résoudre.', tags: ['jargon', 'product'] },
  { category: 'Vocabulaire & Jargon', front: 'Que veut dire "Onboarding" ?', back: 'Le processus d\'accueil et d\'accompagnement d\'un nouvel utilisateur (ou employé) pour qu\'il comprenne vite la valeur du produit.', tags: ['jargon', 'ux'] },
  { category: 'Vocabulaire & Jargon', front: 'Que veut dire "Churn" ?', back: 'L\'attrition. Le taux de perte de clients. L\'ennemi numéro 1 du modèle SaaS.', tags: ['jargon', 'business'] },
  { category: 'Vocabulaire & Jargon', front: 'Que veut dire "Freemium" ?', back: 'Modèle économique : produit gratuit avec fonctions limitées, et version payante (Premium) pour débloquer tout.', tags: ['jargon', 'business'] },
  { category: 'Vocabulaire & Jargon', front: 'Que veut dire "Roadmap" ?', back: 'La feuille de route visuelle des futures fonctionnalités prévues dans le temps (Q1, Q2...).', tags: ['jargon', 'product'] },
  { category: 'Vocabulaire & Jargon', front: 'Que veut dire "KPI" ?', back: 'Key Performance Indicator. Indicateur chiffré clé pour mesurer si on atteint nos objectifs (ex: nombre de ventes/jour).', tags: ['jargon', 'business'] },
  { category: 'Vocabulaire & Jargon', front: 'Que veut dire "Legacy" (Code Legacy) ?', back: 'L\'ancien code existant, souvent mal documenté et difficile à maintenir, mais qui fait tourner la boîte.', tags: ['jargon', 'dev'] },
  { category: 'Vocabulaire & Jargon', front: 'Que veut dire "Tech Stack" ?', back: 'L\'empilement des technologies utilisées (ex: Stack MERN = Mongo, Express, React, Node).', tags: ['jargon', 'dev'] },
  { category: 'Vocabulaire & Jargon', front: 'Que veut dire "Deployment" (Mise en prod) ?', back: 'L\'action de pousser le code depuis l\'ordi du développeur vers le serveur accessible aux vrais utilisateurs.', tags: ['jargon', 'devops'] },
  { category: 'Vocabulaire & Jargon', front: 'Que veut dire "Bug" vs "Feature" ?', back: 'Bug = Erreur non voulue. Feature = Fonctionnalité prévue. Blague dev : "It\'s not a bug, it\'s a feature".', tags: ['jargon', 'culture'] },
  
  // --- 🤖 JARGON IA & NO-CODE SPÉCIFIQUE (20) ---
  { category: 'Vocabulaire & Jargon', front: 'Jargon IA : "Zero-Shot" ?', back: 'Demander à l\'IA de faire une tâche sans lui donner aucun exemple préalable.', tags: ['jargon', 'ai'] },
  { category: 'Vocabulaire & Jargon', front: 'Jargon IA : "Few-Shot" ?', back: 'Donner quelques exemples (3 ou 4) à l\'IA dans le prompt pour qu\'elle comprenne mieux le format attendu.', tags: ['jargon', 'ai'] },
  { category: 'Vocabulaire & Jargon', front: 'Jargon IA : "Hallucination" ?', back: 'Quand l\'IA invente des faits faux avec une grande confiance.', tags: ['jargon', 'ai'] },
  { category: 'Vocabulaire & Jargon', front: 'Jargon IA : "Token" ?', back: 'L\'unité de base du texte pour l\'IA (environ 3/4 d\'un mot). On paye au token.', tags: ['jargon', 'ai'] },
  { category: 'Vocabulaire & Jargon', front: 'Jargon IA : "Temperature" ?', back: 'Le paramètre de créativité. 0 = Robot froid et logique. 1 = Poète créatif (et parfois fou).', tags: ['jargon', 'ai'] },
  { category: 'Vocabulaire & Jargon', front: 'Jargon IA : "Multimodal" ?', back: 'Une IA capable de comprendre plusieurs types de médias à la fois (Texte, Image, Son).', tags: ['jargon', 'ai'] },
  { category: 'Vocabulaire & Jargon', front: 'Jargon IA : "Fine-Tuning" ?', back: 'Ré-entraîner légèrement un modèle sur vos propres données pour le spécialiser.', tags: ['jargon', 'ai'] },
  { category: 'Vocabulaire & Jargon', front: 'Jargon IA : "Inférence" ?', back: 'Le moment où le modèle "réfléchit" et génère une réponse (contraire de l\'Entraînement).', tags: ['jargon', 'ai'] },
  { category: 'Vocabulaire & Jargon', front: 'No-Code : "Workflow" / "Scenario" ?', back: 'La séquence d\'étapes automatisées (Trigger -> Action -> Action).', tags: ['jargon', 'nocode'] },
  { category: 'Vocabulaire & Jargon', front: 'No-Code : "Trigger" (Déclencheur) ?', back: 'L\'événement qui lance l\'automatisation (ex: "Nouvel email reçu", "Formulaire soumis").', tags: ['jargon', 'nocode'] },
  { category: 'Vocabulaire & Jargon', front: 'No-Code : "Mapper" (Mapping) ?', back: 'Relier la donnée sortante de l\'étape A à l\'entrée de l\'étape B (ex: mettre le "Nom" du formulaire dans le "Sujet" du mail).', tags: ['jargon', 'nocode'] },
  { category: 'Vocabulaire & Jargon', front: 'Data : "CRUD" ?', back: 'Create, Read, Update, Delete. Les 4 opérations de base sur n\'importe quelle donnée.', tags: ['jargon', 'data'] },
  { category: 'Vocabulaire & Jargon', front: 'Data : "Query" (Requête) ?', back: 'Une demande d\'information précise envoyée à une base de données.', tags: ['jargon', 'data'] },
  { category: 'Vocabulaire & Jargon', front: 'Data : "Record" (Enregistrement) ?', back: 'Une ligne unique dans une base de données (ex: 1 client, 1 produit).', tags: ['jargon', 'data'] },
  { category: 'Vocabulaire & Jargon', front: 'Data : "Field" (Champ) ?', back: 'Une colonne dans une base de données (ex: Email, Téléphone).', tags: ['jargon', 'data'] }
];

async function seed() {
  console.log(`Inserting batch of ${cards.length} Jargon/Vocab cards...`);
  const { error } = await supabase.from('flashcard_templates').insert(cards);
  if (error) console.error('Error:', error);
  else console.log(`Success! Inserted ${cards.length} cards.`);
}

seed();
