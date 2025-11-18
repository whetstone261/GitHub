import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';

const ConfigurationBanner: React.FC = () => {
  // Check if environment variables are configured
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const isConfigured = !!(supabaseUrl && supabaseKey);
  
  // Don't show banner if properly configured
  if (isConfigured) {
    return null;
  }
  
  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-800">
              ⚠️ Database Configuration Required
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Environment variables are not configured. Authentication and data persistence will not work.
              {' '}
              <a 
                href="https://github.com/whetstone261/GitHub/blob/main/DEPLOYMENT_ENVIRONMENT_SETUP.md"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium inline-flex items-center gap-1 hover:text-yellow-900"
              >
                See setup guide
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
            <details className="mt-2">
              <summary className="text-xs text-yellow-700 cursor-pointer hover:text-yellow-900 font-medium">
                Quick Fix Instructions
              </summary>
              <div className="mt-2 pl-4 text-xs text-yellow-700 border-l-2 border-yellow-300">
                <p className="font-medium mb-1">For local development:</p>
                <ol className="list-decimal list-inside space-y-1 mb-2">
                  <li>Copy <code className="bg-yellow-100 px-1 rounded">.env.example</code> to <code className="bg-yellow-100 px-1 rounded">.env</code></li>
                  <li>Add your Supabase URL and anon key to <code className="bg-yellow-100 px-1 rounded">.env</code></li>
                  <li>Restart the development server</li>
                </ol>
                <p className="font-medium mb-1">For production (Netlify/Vercel):</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to your hosting dashboard</li>
                  <li>Navigate to Environment Variables settings</li>
                  <li>Add <code className="bg-yellow-100 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-yellow-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code></li>
                  <li>Redeploy your site</li>
                </ol>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationBanner;
