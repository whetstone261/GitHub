# 🚀 Quick Fix: Supabase Not Working on Published Site

## The Problem
Your app works in Bolt/local development but not on the published site.

## The Solution (5 minutes)
You need to add environment variables to your hosting platform.

---

## Step-by-Step Fix

### If you're using **Netlify**:

1. **Go to your Netlify dashboard**: https://app.netlify.com
2. Click on your site
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable**
5. Add these two variables:

   ```
   Variable 1:
   Key: VITE_SUPABASE_URL
   Value: [Your Supabase URL]
   
   Variable 2:
   Key: VITE_SUPABASE_ANON_KEY
   Value: [Your Supabase anon key]
   ```

6. Go to **Deploys** tab
7. Click **Trigger deploy** → **Clear cache and deploy site**
8. Wait for deployment to complete
9. **Test your published site** - it should now work!

---

### If you're using **Vercel**:

1. **Go to your Vercel dashboard**: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these two variables:

   ```
   Variable 1:
   Name: VITE_SUPABASE_URL
   Value: [Your Supabase URL]
   Environment: Production, Preview, Development (check all)
   
   Variable 2:
   Name: VITE_SUPABASE_ANON_KEY
   Value: [Your Supabase anon key]
   Environment: Production, Preview, Development (check all)
   ```

5. Go to **Deployments** tab
6. Click **•••** on latest deployment → **Redeploy**
7. Wait for deployment to complete
8. **Test your published site** - it should now work!

---

## Where to Find Your Supabase Values

1. Go to https://app.supabase.com
2. Select your project
3. Click **Settings** (gear icon) → **API**
4. Copy:
   - **Project URL** → Use for `VITE_SUPABASE_URL`
   - **anon public** key → Use for `VITE_SUPABASE_ANON_KEY`

---

## Verify It's Working

After redeploying, visit your published site and:

1. Open browser console (F12)
2. You should see: ✅ NO "Supabase not configured" errors
3. Try signing up or signing in
4. It should work without errors!

**If you still see errors:**
- Double-check variable names are exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Make sure there are no extra spaces in the values
- Try clearing cache and redeploying again
- Check the browser console for specific error messages

---

## Why This Happens

- `.env` file only works in local development
- Production deployments don't include `.env` (security feature)
- You must configure environment variables in your hosting platform
- This is normal and expected behavior!

---

## Need More Help?

See the detailed guides:
- [DEPLOYMENT_ENVIRONMENT_SETUP.md](./DEPLOYMENT_ENVIRONMENT_SETUP.md) - Complete deployment guide
- [README.md](./README.md) - Full project documentation
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database information

---

**That's it! Your app should now work on the published site. 🎉**
