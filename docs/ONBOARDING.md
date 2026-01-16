# Système d'Onboarding

## Vue d'ensemble

Le système d'onboarding permet de collecter des informations sur les nouveaux utilisateurs lors de leur première connexion afin de personnaliser leur expérience.

## Fonctionnalités

### Formulaire en 4 étapes

1. **Type d'utilisateur** : Professionnel ou Particulier
2. **Niveau d'expérience** : Débutant, Intermédiaire ou Pro
3. **Centres d'intérêt** : Sélection multiple parmi 12 sujets IA
4. **Outils utilisés** : Sélection multiple parmi 12 outils IA (optionnel)

### Animation

- Le formulaire apparaît avec une animation **slide de bas en haut** (bottom-up)
- Transitions fluides entre les étapes avec Framer Motion
- Barre de progression visuelle
- Backdrop avec effet blur

## Structure technique

### Composants

- **`OnboardingModal.tsx`** : Composant principal du formulaire
  - Gère l'état local du formulaire
  - Animations avec Framer Motion
  - Navigation entre les étapes
  - Validation des données

### Hooks

- **`useOnboarding.ts`** : Hook personnalisé pour gérer l'état d'onboarding
  - Vérifie si l'utilisateur a complété l'onboarding
  - Sauvegarde les données dans Supabase
  - Gère l'ouverture/fermeture du modal

### Base de données

Champs ajoutés à la table `user_profiles` :

```sql
- onboarding_completed: BOOLEAN (défaut: false)
- user_type: VARCHAR(20) ('professionnel' | 'particulier')
- experience_level: VARCHAR(20) ('debutant' | 'intermediaire' | 'pro')
- interests: TEXT[] (array de sujets)
- tools_used: TEXT[] (array d'outils)
```

## Utilisation

### Intégration dans une page

```tsx
import OnboardingModal from '@/components/OnboardingModal';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function Page() {
  const { isOnboardingOpen, isLoading, completeOnboarding, skipOnboarding } = useOnboarding();

  return (
    <>
      {/* Votre contenu */}
      
      {!isLoading && (
        <OnboardingModal
          isOpen={isOnboardingOpen}
          onClose={skipOnboarding}
          onComplete={completeOnboarding}
        />
      )}
    </>
  );
}
```

## Migration de la base de données

Pour appliquer les changements à votre base de données Supabase :

```bash
# Si vous utilisez Supabase CLI
supabase db push

# Ou exécutez manuellement le fichier de migration
supabase/migrations/add_onboarding_fields.sql
```

## Personnalisation

### Modifier les options

Éditez les constantes dans `OnboardingModal.tsx` :

```tsx
const INTERESTS_OPTIONS = [
  // Ajoutez vos sujets ici
];

const TOOLS_OPTIONS = [
  // Ajoutez vos outils ici
];
```

### Modifier l'animation

Ajustez les paramètres de Framer Motion :

```tsx
<motion.div
  initial={{ y: '100%' }}
  animate={{ y: 0 }}
  exit={{ y: '100%' }}
  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
>
```

## Comportement

- Le modal s'affiche automatiquement si `onboarding_completed` est `false`
- L'utilisateur peut fermer le modal (skip) mais il réapparaîtra à la prochaine visite
- Une fois complété, le modal ne s'affiche plus
- Les données sont sauvegardées dans Supabase via upsert

## Améliorations futures

- [ ] Ajouter une étape de confirmation finale
- [ ] Permettre de modifier les préférences depuis le profil
- [ ] Ajouter des animations plus élaborées
- [ ] Implémenter un système de recommandations basé sur les réponses
- [ ] Ajouter des analytics pour suivre le taux de completion
