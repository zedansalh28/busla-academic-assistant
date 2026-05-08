import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { usePlans, useRecommendations } from '@/hooks/usePlans';
import { DashboardLayout } from '@/components/Common/DashboardLayout';
import { ProfileSummary, RecommendationsCard } from '@/components/Dashboard';
import { Loading } from '@/components/Common/Loaders';
import { sessionService } from '@/services/sessionService';
import { Plus, FlaskConical } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { plans } = usePlans(user?.id || null);
  const { recommendations, loading: recsLoading } = useRecommendations(user?.id || null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <Loading />;
  }

  const completedPlans = plans.filter((p) => p.progress === 100).length;
  const totalPlans = plans.length;
  const isDemo = sessionService.isDemoMode();

  return (
    <DashboardLayout onLogout={logout} title="Dashboard">
      <div className="space-y-6">

        {/* Demo mode banner */}
        {isDemo && (
          <div className="flex items-center space-x-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            <FlaskConical size={18} className="flex-shrink-0 text-amber-600" />
            <span>
              <strong>Demo Mode Active</strong> — You are viewing a sample SCE student profile with pre-loaded demo courses and study data.
              To start fresh, click <strong>Logout</strong> in the sidebar.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{totalPlans}</div>
              <p className="text-gray-600">Active Study Plans</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-2">{completedPlans}</div>
              <p className="text-gray-600">Completed Plans</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary mb-2">{user.year}</div>
              <p className="text-gray-600">Academic Year</p>
            </div>
          </div>
        </div>

        <ProfileSummary user={user} onEdit={() => router.push('/profile')} />

        <RecommendationsCard recommendations={recommendations} loading={recsLoading} />

        <div className="flex justify-center pt-4">
          <button
            onClick={() => router.push('/planner')}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Create Study Plan</span>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
