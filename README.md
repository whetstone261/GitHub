# Guided Gains - AI-Powered Workout Planner

A React-based fitness application that helps users create personalized workout plans, track progress, and achieve their fitness goals.

## 🚀 Features

- **User Authentication** - Secure sign-up and sign-in with Supabase
- **Personalized Workouts** - AI-generated workout plans based on user preferences
- **Progress Tracking** - Track workout completions, streaks, and achievements
- **Equipment Flexibility** - Customizable workouts based on available equipment
- **Calendar Integration** - Optional Google Calendar sync
- **Mobile Responsive** - Works seamlessly on all devices

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/whetstone261/GitHub.git
   cd GitHub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your Supabase credentials:
   ```bash
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   You can find these values in your [Supabase project settings](https://app.supabase.com) under Settings → API.

4. **Run the development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

## 🚢 Deployment

This app works in local development (Bolt) but requires additional configuration for production deployment.

### ⚠️ Important: Environment Variables for Production

**The `.env` file only works in local development.** For production deployments, you must configure environment variables in your hosting platform.

### Deployment to Netlify

1. **Push your code to GitHub**

2. **Connect to Netlify**
   - Go to [Netlify](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository

3. **Configure Environment Variables**
   - In your Netlify dashboard, go to **Site settings** → **Environment variables**
   - Click **Add a variable** and add:
     - `VITE_SUPABASE_URL` = your Supabase URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

4. **Deploy Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   
5. **Deploy**
   - Click "Deploy site"
   - After adding environment variables, trigger a new deploy: **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

### Deployment to Vercel

1. **Push your code to GitHub**

2. **Connect to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   - During setup or in **Settings** → **Environment Variables**, add:
     - `VITE_SUPABASE_URL` = your Supabase URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - Select all environments: Production, Preview, Development

4. **Deploy**
   - Click "Deploy"
   - If you added variables after initial deploy, redeploy from **Deployments** tab

### Troubleshooting Deployment Issues

**Problem: "Supabase not configured" error on published site**

This happens when environment variables are not set in your hosting platform.

**Solution:**
1. Check browser console (F12) for detailed error messages
2. Verify environment variables are added in hosting platform settings
3. Ensure variable names are exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Redeploy after adding variables (clear cache if possible)
5. See [DEPLOYMENT_ENVIRONMENT_SETUP.md](./DEPLOYMENT_ENVIRONMENT_SETUP.md) for detailed instructions

**Verification:**
Open browser console on your published site and run:
```javascript
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key set:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

Both should show values (not `undefined`).

## 📚 Documentation

- [Database Setup](./DATABASE_SETUP.md) - Complete database schema and setup
- [Deployment Guide](./DEPLOYMENT_ENVIRONMENT_SETUP.md) - Detailed deployment instructions
- [Auth System](./AUTH_SYSTEM_IMPROVEMENTS.md) - Authentication documentation
- [Workout Features](./WORKOUT_COMPLETION_TRACKING.md) - Workout tracking system

## 🏗️ Database Schema

The app uses Supabase with the following main tables:
- `profiles` - User profile information
- `onboarding_preferences` - User fitness preferences
- `workout_completions` - Completed workout records
- `saved_workout_plans` - Saved/scheduled workouts
- `exercise_logs` - Detailed exercise logs
- `user_stats` - User progress statistics

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for complete schema.

## 🧪 Development

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

### Lint code
```bash
npm run lint
```

## 🔒 Security

- Environment variables are never committed to the repository
- `.env` is included in `.gitignore`
- Supabase anon key is safe to expose in client code (protected by Row Level Security)
- All database operations use RLS policies

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a personal project. If you have suggestions, please open an issue.

## 💡 Support

For issues or questions:
1. Check the [Deployment Guide](./DEPLOYMENT_ENVIRONMENT_SETUP.md)
2. Review browser console for error messages
3. Open an issue on GitHub

---

**Built with ❤️ using React, TypeScript, and Supabase**
