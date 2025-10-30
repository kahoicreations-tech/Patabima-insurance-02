# Adding Poppins Fonts to PataBima App

## Step 1: Download Poppins Fonts

1. **Go to Google Fonts:**

   - Visit: https://fonts.google.com/specimen/Poppins
   - Click "Download family" button

2. **Or download directly from GitHub:**
   - Visit: https://github.com/google/fonts/tree/main/ofl/poppins
   - Download these 4 font files:
     - `Poppins-Regular.ttf` (400 weight)
     - `Poppins-Medium.ttf` (500 weight)
     - `Poppins-SemiBold.ttf` (600 weight)
     - `Poppins-Bold.ttf` (700 weight)

## Step 2: Add Fonts to Your Project

1. **Navigate to the fonts folder:**

   ```
   frontend/assets/fonts/
   ```

2. **Place the downloaded font files:**
   ```
   frontend/assets/fonts/
   ├── Poppins-Regular.ttf
   ├── Poppins-Medium.ttf
   ├── Poppins-SemiBold.ttf
   └── Poppins-Bold.ttf
   ```

## Step 3: Verify Installation

The fonts are already configured in `App.js`:

```javascript
await Font.loadAsync({
  Poppins_400Regular: require("./assets/fonts/Poppins-Regular.ttf"),
  Poppins_500Medium: require("./assets/fonts/Poppins-Medium.ttf"),
  Poppins_600SemiBold: require("./assets/fonts/Poppins-SemiBold.ttf"),
  Poppins_700Bold: require("./assets/fonts/Poppins-Bold.ttf"),
});
```

## Step 4: Test the App

After adding the font files:

```bash
# Clear cache and restart
cd frontend
npx expo start --clear
```

Press `a` for Android or `i` for iOS.

## Troubleshooting

### If fonts don't load:

1. **Check file names match exactly:**

   - File: `Poppins-Regular.ttf` (case-sensitive)
   - Code: `require('./assets/fonts/Poppins-Regular.ttf')`

2. **Clear Metro bundler cache:**

   ```bash
   npx expo start --clear
   ```

3. **Restart development server:**
   - Stop the server (Ctrl+C)
   - Run `npx expo start` again

### If you see "Unable to resolve" errors:

1. Make sure all 4 font files are in `assets/fonts/`
2. File names must match exactly (case-sensitive)
3. Clear cache and restart

## Quick Download Links

**Google Fonts (Official):**

- https://fonts.google.com/specimen/Poppins

**GitHub (Direct Files):**

- https://github.com/google/fonts/tree/main/ofl/poppins

## Alternative: Use System Fonts (Temporary)

If you want to test without Poppins fonts first, you can temporarily use system fonts:

1. Comment out the font loading in `App.js`:

```javascript
// await Font.loadAsync({
//   'Poppins_400Regular': require('./assets/fonts/Poppins-Regular.ttf'),
//   ...
// });
```

2. Update `Typography.js` to use system fonts:

```javascript
fontFamily: {
  regular: 'System',  // or 'Roboto' for Android
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
}
```

But for best results, **use Poppins fonts** as designed!

---

## Status After Adding Fonts

Once fonts are added:
✅ App will load Poppins fonts from local assets
✅ Typography system will work perfectly
✅ All typography components will use Poppins
✅ No external package dependencies needed

---

**Next Step:** Download the 4 Poppins font files and place them in `frontend/assets/fonts/`
