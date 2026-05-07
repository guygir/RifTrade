#!/bin/bash

# UNL Deployment Script
# This script commits and pushes all UNL integration changes

echo "🚀 UNL Deployment Script"
echo "========================"
echo ""

# Check if there are changes to commit
if [[ -z $(git status -s) ]]; then
  echo "✅ No changes to commit. Already up to date!"
  exit 0
fi

echo "📝 Staging all changes..."
git add .

echo ""
echo "💾 Committing changes..."
git commit -m "feat: Add UNL set (403 cards) + pagination + remove promotional sets + update poll

- Added 403 UNL cards (280 base + 123 foil variants)
- Removed 14 promotional cards (OPP, PR, JDG sets)
- Implemented pagination for card loading (fixes 1000-row limit)
- Updated Riftle poll section with UNL announcement
- Updated seeding script to skip promotional sets
- Fixed TypeScript build by excluding scripts folder
- Total cards: 1,389 (OGN: 505, OGS: 32, SFD: 405, UNL: 403)"

echo ""
echo "🌐 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔗 Vercel will automatically deploy the changes."
echo "📊 Monitor deployment at: https://vercel.com/dashboard"

# Made with Bob
