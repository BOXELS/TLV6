import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { testUserRole } from '../utils/roleTest';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

type VersionInfo = {
  version: string;
  changes: string;
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  useEffect(() => {
    loadLatestVersion();
  }, []);

  const loadLatestVersion = async () => {
    try {
      const { data, error } = await supabase
        .from('version_history')
        .select('*')
        .order('released_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setVersionInfo({
          version: data.version,
          changes: data.changes
        });
      } else {
        // Fallback to default version if no entries exist
        setVersionInfo({
          version: '1.2.9',
          changes: 'Version bump'
        });
      }
    } catch (error) {
      console.error('Error loading version info:', error);
      // Use fallback version on any error
      setVersionInfo({
        version: '1.2.9',
        changes: 'Version bump'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter both email and password');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await signIn(email, password);
      await testUserRole(email);
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid email or password';
      toast.error(message === 'Invalid login credentials' ? 'Invalid email or password' : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <FileText className="h-12 w-12 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          VENDOR / DESIGNER Portal
        </h2>
        <div className="mt-2 text-center">
          <p className="text-sm font-medium text-gray-600">
            Version {versionInfo?.version || '1.2.9'}
          </p>
          <p className="mt-1 text-sm text-gray-500 whitespace-pre-wrap">
            {versionInfo?.changes || 'Version bump'}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}