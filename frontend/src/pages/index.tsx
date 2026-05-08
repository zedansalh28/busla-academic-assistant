import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { OnboardingForm } from '@/components/Forms/OnboardingForm';
import { Loading } from '@/components/Common/Loaders';
import { storage } from '@/utils/storage';
import { STORAGE_KEYS } from '@/utils/constants';
import { BookOpen, Zap, Users, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, loading, createProfile } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleDemoMode = async () => {
    setDemoLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/demo/load/0`, { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        storage.setItem(STORAGE_KEYS.USER_ID, data.userId);
        storage.setItem(STORAGE_KEYS.SESSION_ID, data.sessionId);
        localStorage.setItem(STORAGE_KEYS.IS_DEMO, 'true');
        window.location.reload();
      }
    } catch (error) {
      console.error('Demo mode error:', error);
      alert('Failed to load demo. Try manual onboarding.');
    } finally {
      setDemoLoading(false);
    }
  };

  // Only show the global loader during the initial auth check, not during profile submission
  if (loading && !showOnboarding) {
    return <Loading message="Initializing Busla..." />;
  }

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <OnboardingForm onSubmit={createProfile} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <nav className="bg-white bg-opacity-80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Busla</h1>
          </div>
          <p className="text-sm text-gray-600">Your AI Academic Assistant</p>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left side - Hero text */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-gray-900 leading-tight">
                Meet Your Academic <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Assistant</span>
              </h2>
              <p className="text-xl text-gray-600">
                Personalized learning support tailored to your learning style. Available whenever you need help.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Instant Help</h3>
                  <p className="text-gray-600 text-sm">Get answers anytime, without waiting for office hours</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users size={24} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Personalized Learning</h3>
                  <p className="text-gray-600 text-sm">Responses adapted to your learning style and level</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen size={24} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Study Planning</h3>
                  <p className="text-gray-600 text-sm">Create plans, track progress, and stay organized</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8">
              <button
                onClick={() => setShowOnboarding(true)}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center space-x-2 group"
              >
                <span>Get Started</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={handleDemoMode}
                disabled={demoLoading}
                className="px-8 py-3 bg-white border-2 border-gray-300 text-gray-900 font-semibold rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50"
              >
                {demoLoading ? 'Loading Demo...' : 'Try Demo'}
              </button>
            </div>

            <p className="text-sm text-gray-500 pt-4">
              ✓ Privacy-first • ✓ No data collection • ✓ Anonymous sessions
            </p>
          </div>

          {/* Right side - Demo Preview */}
          <div className="space-y-4">
            {/* Chat Preview Card */}
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
                <h3 className="font-semibold">Chat Example</h3>
                <p className="text-sm text-blue-100">Academic Assistant</p>
              </div>
              <div className="h-80 p-6 space-y-4 overflow-y-auto bg-gray-50">
                {/* Message 1 - User */}
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-xs">
                    <p className="text-sm">How do I study for exams effectively?</p>
                  </div>
                </div>

                {/* Message 2 - Assistant */}
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 max-w-xs">
                    <p className="text-sm font-semibold text-blue-600 mb-2">Here's a practical approach:</p>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>✓ <strong>Week 1:</strong> Review notes</li>
                      <li>✓ <strong>Week 2:</strong> Practice problems</li>
                      <li>✓ <strong>Week 3:</strong> Test yourself</li>
                    </ul>
                  </div>
                </div>

                {/* Smart Suggestions */}
                <div className="flex justify-start pt-2">
                  <div className="text-xs text-gray-600">
                    💡 <span className="font-semibold">Suggested next steps:</span>
                    <div className="mt-1">• Try practice problems</div>
                    <div>• Form a study group</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-2xl font-bold text-blue-600">3+</p>
                <p className="text-sm text-gray-600">Learning Styles</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-2xl font-bold text-indigo-600">24/7</p>
                <p className="text-sm text-gray-600">Available</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white bg-opacity-50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-gray-600">
          <p>Built for students, by students • Privacy-first academic support</p>
          <p className="mt-2 text-xs">No personal data stored • Anonymous sessions • GDPR/FERPA Compliant</p>
        </div>
      </div>
    </div>
  );
}

