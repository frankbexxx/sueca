# Setup Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Copy Card Assets**
   
   The card images need to be accessible from the public folder. You have two options:

   **Option A: Copy assets to public folder (Recommended)**
   ```bash
   # From the project root
   xcopy /E /I assets frontend\public\assets
   ```
   
   Or on Linux/Mac:
   ```bash
   cp -r assets frontend/public/
   ```

   **Option B: Create a symbolic link**
   ```bash
   # Windows (as Administrator)
   mklink /D frontend\public\assets ..\assets
   
   # Linux/Mac
   ln -s ../../assets frontend/public/assets
   ```

3. **Start Development Server**
   ```bash
   cd frontend
   npm start
   ```

   The app will open at `http://localhost:3000`

## Building for Production

```bash
cd frontend
npm run build
```

Make sure the assets folder is copied to `frontend/public/assets` before building, or the card images won't be included in the build.

## Deployment

After building, the `frontend/build` folder contains everything needed for deployment. The assets will be included if they're in the `public` folder.


