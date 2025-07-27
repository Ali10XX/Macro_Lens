# Food Database API Setup

## 🔑 Adding Your API Keys

Since you mentioned you already have API keys, here's how to activate them:

### 1. Update Environment Variables

Edit `frontend/.env.local` and replace the placeholder values with your actual API keys:

```env
# Food Database API Keys
NEXT_PUBLIC_USDA_API_KEY=YOUR_ACTUAL_USDA_KEY_HERE
NEXT_PUBLIC_EDAMAM_APP_ID=YOUR_ACTUAL_EDAMAM_APP_ID_HERE  
NEXT_PUBLIC_EDAMAM_APP_KEY=YOUR_ACTUAL_EDAMAM_APP_KEY_HERE
NEXT_PUBLIC_SPOONACULAR_API_KEY=YOUR_ACTUAL_SPOONACULAR_KEY_HERE

# Enable external food APIs
NEXT_PUBLIC_USE_EXTERNAL_FOOD_API=true
```

### 2. API Providers & Keys

**USDA FoodData Central (FREE)**
- Website: https://fdc.nal.usda.gov/api-guide.html
- Sign up: https://fdc.nal.usda.gov/api-key-signup.html
- Usage: 3,600 requests/hour (free)

**Edamam Nutrition API (FREEMIUM)**  
- Website: https://developer.edamam.com/food-database-api
- Free tier: 100 requests/month
- Paid: Starting at $0.006/request

**Spoonacular API (FREEMIUM)**
- Website: https://spoonacular.com/food-api
- Free tier: 150 requests/day
- Paid: Starting at $0.004/request

### 3. Test Your Setup

1. Restart your development server after adding keys:
```bash
npm run dev
```

2. Go to the Nutrition page and search for a food
3. You should see results from "USDA Database" and "Edamam Database" in addition to local foods

### 4. API Integration Order

The system searches in this order:
1. **Local Database** (instant, offline) - ~50 foods
2. **USDA API** (if key provided) - 600,000+ foods
3. **Edamam API** (if key provided) - supplement USDA results
4. **Custom Entry** (manual input)

### 5. Troubleshooting

**If APIs don't work:**
- Check browser console for error messages
- Verify API keys are correct
- Ensure `NEXT_PUBLIC_USE_EXTERNAL_FOOD_API=true`
- Check API rate limits haven't been exceeded

**Fallback behavior:**
- If external APIs fail, the app continues working with the local database
- No functionality is lost - just fewer food options

### 6. Production Considerations

**Security:**
- API keys in `.env.local` are safe for client-side use
- USDA API key can be safely exposed (it's designed for client-side use)
- Consider rate limiting in production

**Performance:**
- API calls are debounced (300ms delay)
- Results are cached during the session
- Local database provides instant results

**Cost Management:**
- USDA API is completely free
- Monitor Edamam/Spoonacular usage to avoid overages
- Consider implementing caching strategies for frequently searched foods

## ✅ Ready to Use!

Once you add your API keys, your food database will have access to hundreds of thousands of foods with accurate nutrition data!