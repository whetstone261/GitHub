# Deployment Environment Variables Setup

## ⚠️ Issue: Supabase Not Working on Published Site

The `.env` file is **not included** in production builds for security reasons. You must configure environment variables directly in your hosting platform.

---

## 🔑 Required Environment Variables

Add these to your hosting platform's environment variable settings:

```bash
VITE_SUPABASE_URL=https://ikbxkwbdzlzelrbickat.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYnhrd2Jkemx6ZWxyYmlja2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDA0MTgsImV4cCI6MjA3NDQxNjQxOH0.xzlFuVO1E3rNl3mBtf1k0_dTyi0A_jYx_BCYsEX2tMo
```

---

## 📋 Setup Instructions by Platform

### **Netlify**

1. **Go to your Netlify dashboard**
   - Navigate to your site
   - Click **Site settings**

2. **Add Environment Variables**
   - Click **Environment variables** (under "Build & deploy")
   - Click **Add a variable**

3. **Add both variables:**
   ```
   Key: VITE_SUPABASE_URL
   Value: https://ikbxkwbdzlzelrbickat.supabase.co

   Key: VITE_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYnhrd2Jkemx6ZWxyYmlja2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDA0MTgsImV4cCI6MjA3NDQxNjQxOH0.xzlFuVO1E3rNl3mBtf1k0_dTyi0A_jYx_BCYsEX2tMo
   ```

4. **Redeploy**
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Clear cache and deploy site**

---

### **Vercel**

1. **Go to your Vercel dashboard**
   - Select your project
   - Click **Settings**

2. **Add Environment Variables**
   - Click **Environment Variables** (left sidebar)
   - Add each variable:

3. **Add both variables:**
   ```
   Name: VITE_SUPABASE_URL
   Value: https://ikbxkwbdzlzelrbickat.supabase.co
   Environment: Production, Preview, Development (check all)

   Name: VITE_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYnhrd2Jkemx6ZWxyYmlja2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDA0MTgsImV4cCI6MjA3NDQxNjQxOH0.xzlFuVO1E3rNl3mBtf1k0_dTyi0A_jYx_BCYsEX2tMo
   Environment: Production, Preview, Development (check all)
   ```

4. **Redeploy**
   - Go to **Deployments** tab
   - Click **•••** on latest deployment → **Redeploy**

---

### **GitHub Pages / Other Static Hosts**

GitHub Pages and similar static hosts **cannot use environment variables** securely. For these platforms, you have two options:

**Option 1: Hard-code values (NOT RECOMMENDED for production)**
- Replace `import.meta.env.VITE_SUPABASE_URL` with the actual URL
- Replace `import.meta.env.VITE_SUPABASE_ANON_KEY` with the actual key
- **Security Risk:** Keys are exposed in client code

**Option 2: Use a different hosting platform**
- Switch to Netlify or Vercel (recommended)
- Both have free tiers with environment variable support

---

## ✅ Verification Steps

After adding environment variables and redeploying:

### **1. Check Console**
Open browser DevTools on your published site:
```javascript
// Should NOT be undefined
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
```

### **2. Test Authentication**
1. Click "Get Started" on landing page
2. Try to sign up with email/password
3. Check console for Supabase logs
4. If successful → Environment variables are working ✅

### **3. Check Network Tab**
1. Open DevTools → Network tab
2. Try to sign up/sign in
3. Look for requests to `ikbxkwbdzlzelrbickat.supabase.co`
4. If you see requests → Supabase is connected ✅

---

## 🔍 Common Issues

### **Issue: "Supabase not configured" in console**

**Cause:** Environment variables not set or not available

**Solution:**
1. Verify environment variables are added to hosting platform
2. Ensure variable names start with `VITE_` (Vite requirement)
3. Redeploy the site (clear cache if possible)
4. Wait 1-2 minutes for changes to propagate

---

### **Issue: Variables work locally but not in production**

**Cause:** `.env` file only works locally

**Solution:**
1. Add variables to hosting platform settings
2. **DO NOT** commit `.env` file to git (security risk)
3. Each hosting platform needs separate configuration

---

### **Issue: Still not working after adding variables**

**Troubleshooting Steps:**

1. **Check variable names are exact:**
   ```
   VITE_SUPABASE_URL (not SUPABASE_URL)
   VITE_SUPABASE_ANON_KEY (not SUPABASE_ANON_KEY)
   ```

2. **Check for typos in values**
   - Copy/paste from this document
   - No extra spaces before or after

3. **Clear cache and redeploy**
   - Hosting platforms may cache builds
   - Force a fresh build

4. **Check build logs**
   - Look for environment variable errors
   - Verify build completes successfully

---

## 📱 Platform-Specific Notes

### **Netlify**
- ✅ Supports environment variables
- ✅ Free tier available
- ✅ Auto-deploys from Git
- ✅ Easy environment variable management
- **Recommended for this project**

### **Vercel**
- ✅ Supports environment variables
- ✅ Free tier available
- ✅ Auto-deploys from Git
- ✅ Excellent performance
- **Recommended for this project**

### **GitHub Pages**
- ❌ No environment variable support
- ❌ Keys would be exposed in code
- ❌ Not suitable for apps with API keys
- **Not recommended for this project**

### **Cloudflare Pages**
- ✅ Supports environment variables
- ✅ Free tier available
- ✅ Similar setup to Netlify/Vercel

---

## 🔐 Security Notes

### **NEVER:**
- ❌ Commit `.env` file to Git
- ❌ Share environment variables publicly
- ❌ Hard-code keys in source code (for production)
- ❌ Use production keys in screenshots/demos

### **ALWAYS:**
- ✅ Use hosting platform's environment variable settings
- ✅ Keep `.env.example` (without actual values) for documentation
- ✅ Add `.env` to `.gitignore` (already done)
- ✅ Use different keys for development and production (if needed)

---

## 📋 Quick Checklist

Before your published site will work with Supabase:

- [ ] Environment variables added to hosting platform
- [ ] Both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set
- [ ] Variable names spelled correctly (case-sensitive)
- [ ] Values copied without typos or extra spaces
- [ ] Site redeployed after adding variables
- [ ] Cache cleared (if applicable)
- [ ] Tested authentication on published site
- [ ] Console shows no "Supabase not configured" warnings

---

## 🆘 Still Having Issues?

### **Check Browser Console:**
```javascript
// Run this in console on published site
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Has Anon Key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

**Expected Output:**
```
Supabase URL: https://ikbxkwbdzlzelrbickat.supabase.co
Has Anon Key: true
```

**If you see `undefined`:**
- Environment variables not configured correctly
- Need to add them to hosting platform
- Need to redeploy

---

## 📝 Summary

**Why Supabase doesn't work on published site:**
- `.env` file is local only (not in production)
- Environment variables must be set in hosting platform
- Each platform has its own environment variable settings

**Solution:**
1. Go to your hosting platform dashboard (Netlify/Vercel)
2. Find "Environment Variables" settings
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Redeploy your site
5. Test authentication on published URL

**Once configured:**
- ✅ Sign up/sign in will work
- ✅ Database queries will work
- ✅ All Supabase features operational
- ✅ Same functionality as local development

---

## 🎯 Next Steps

1. **Choose your hosting platform** (Netlify or Vercel recommended)
2. **Add environment variables** using instructions above
3. **Redeploy your site** (clear cache)
4. **Test authentication** on published URL
5. **Verify in console** that variables are loaded

**Your site will be fully functional once environment variables are configured!** 🚀
