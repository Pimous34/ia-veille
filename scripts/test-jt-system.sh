#!/bin/bash
# Script de test pour le système de JT quotidien
# Usage: ./test-jt-system.sh

set -e

echo "🧪 Test du système de JT quotidien"
echo "=================================="
echo ""

# Vérifier les variables d'environnement
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ SUPABASE_URL n'est pas défini"
    echo "Définissez-le avec: export SUPABASE_URL=https://xxx.supabase.co"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY n'est pas défini"
    echo "Définissez-le avec: export SUPABASE_SERVICE_ROLE_KEY=xxx"
    exit 1
fi

echo "✅ Variables d'environnement configurées"
echo ""

# Test 1: Vérifier que fetch-rss fonctionne
echo "📡 Test 1: Agrégation RSS"
echo "-------------------------"
FETCH_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  "$SUPABASE_URL/functions/v1/fetch-rss")

echo "$FETCH_RESPONSE" | jq '.'
ARTICLES_ADDED=$(echo "$FETCH_RESPONSE" | jq -r '.total_articles_added // 0')
echo "Articles ajoutés: $ARTICLES_ADDED"
echo ""

# Test 2: Vérifier qu'il y a des articles récents
echo "📰 Test 2: Vérification des articles récents"
echo "--------------------------------------------"
# Cette partie nécessite l'accès direct à la base de données
# Vous pouvez l'exécuter manuellement dans le SQL Editor de Supabase
echo "Exécutez cette requête dans Supabase SQL Editor:"
echo "SELECT COUNT(*) FROM articles WHERE published_at > NOW() - INTERVAL '24 hours';"
echo ""

# Test 3: Déclencher la sélection des news
echo "🎯 Test 3: Sélection des news du jour"
echo "-------------------------------------"
SELECT_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  "$SUPABASE_URL/functions/v1/select-daily-news")

echo "$SELECT_RESPONSE" | jq '.'
SELECTED_COUNT=$(echo "$SELECT_RESPONSE" | jq -r '.selected_count // 0')
echo "Articles sélectionnés: $SELECTED_COUNT"
echo ""

# Test 4: Vérifier le statut du JT
echo "🎬 Test 4: Vérification du JT généré"
echo "------------------------------------"
echo "Exécutez cette requête dans Supabase SQL Editor:"
echo "SELECT id, date, title, status, video_url FROM daily_news_videos ORDER BY date DESC LIMIT 1;"
echo ""

# Test 5: Vérifier les logs
echo "📊 Test 5: Vérification des logs"
echo "--------------------------------"
echo "Pour voir les logs, exécutez:"
echo "supabase functions logs select-daily-news --tail"
echo "supabase functions logs generate-daily-jt --tail"
echo ""

echo "✅ Tests terminés!"
echo ""
echo "📝 Prochaines étapes:"
echo "1. Vérifiez les résultats ci-dessus"
echo "2. Consultez les logs dans le Dashboard Supabase"
echo "3. Vérifiez la table daily_news_videos dans le SQL Editor"
echo "4. Visitez /jt sur votre site pour voir le JT"
