#!/bin/bash
# Скрипт для настройки Railway проекта

echo "🚀 Настройка Railway проекта для harmonizer"
echo ""

# Проверка авторизации
echo "Проверка авторизации..."
if ! railway whoami > /dev/null 2>&1; then
    echo "❌ Не авторизован. Выполните: railway login"
    exit 1
fi

echo "✅ Авторизован: $(railway whoami | head -1)"
echo ""

# Инструкции для ручной настройки
echo "📋 Инструкции для настройки через веб-интерфейс:"
echo ""
echo "1. Откройте: https://railway.app"
echo "2. Выберите проект 'harmonizer'"
echo "3. Нажмите на сервис"
echo "4. Settings → Source → Root Directory: backend"
echo "5. Variables → Добавьте:"
echo "   - ENVIRONMENT=production"
echo "   - FRONTEND_URL=https://vadimtoptunov.github.io/harmonizer"
echo "6. Скопируйте URL проекта"
echo ""
echo "После этого выполните:"
echo "  railway link"
echo "  railway variables set ENVIRONMENT=production"
echo "  railway variables set FRONTEND_URL=https://vadimtoptunov.github.io/harmonizer"
echo "  railway domain"
echo ""

