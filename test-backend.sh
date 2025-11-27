#!/bin/bash

echo "🔍 Probando backend en http://localhost:5000"
echo ""

echo "1. Probando ruta raíz..."
curl -s http://localhost:5000/ | head -20
echo ""
echo ""

echo "2. Probando /api/health..."
curl -s http://localhost:5000/api/health
echo ""
echo ""

echo "3. Probando /api/books..."
curl -s http://localhost:5000/api/books | head -50
echo ""
echo ""

echo "✅ Pruebas completadas"
