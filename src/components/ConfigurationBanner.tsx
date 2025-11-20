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
              ⚠️ Supabase Configuration Required
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Environment variables are not configured. Authentication and data persistence will not work.
              {' '}
              <a
                href="https://supabase.com/dashboard/project/ikbxkwbdzlzelrbickat/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium inline-flex items-center gap-1 hover:text-yellow-900"
              >
                Get Supabase keys
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
            <details className="mt-2">
              <summary className="text-xs text-yellow-700 cursor-pointer hover:text-yellow-900 font-medium">
                How to Fix (5 steps)
              </summary>
              <div className="mt-2 pl-4 text-xs text-yellow-700 border-l-2 border-yellow-300">
                <p className="font-medium mb-2">In Bolt.new:</p>
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>Click the <strong>⚙️ Settings</strong> icon in the left sidebar</li>
                  <li>Navigate to <strong>Secrets</strong> section</li>
                  <li>Add variable: <code className="bg-yellow-100 px-1 rounded font-mono">VITE_SUPABASE_URL</code> = <code className="bg-yellow-100 px-1 rounded text-[10px]">https://ikbxkwbdzlzelrbickat.supabase.co</code></li>
                  <li>Add variable: <code className="bg-yellow-100 px-1 rounded font-mono">VITE_SUPABASE_ANON_KEY</code> = <span className="text-[10px]">[your anon key from Supabase]</span></li>
                  <li><strong>Restart the preview server</strong> to load the secrets</li>
                </ol>
                <p className="mt-2 text-[10px] text-yellow-600">
                  Get your anon key from the Supabase link above (Project Settings → API)
                </p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationBanner;
