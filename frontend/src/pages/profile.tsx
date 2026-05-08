import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/Common/DashboardLayout';
import { ProfileForm } from '@/components/Forms/ProfileForm';
import { Loading } from '@/components/Common/Loaders';

export default function Profile() {
  const router = useRouter();
  const { user, loading: authLoading, updateProfile, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <Loading />;
  }

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await updateProfile(data);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout onLogout={logout} title="Edit Profile">
      <div className="max-w-4xl mx-auto">
        <ProfileForm initialData={user} onSubmit={handleSubmit} loading={loading} />
      </div>
    </DashboardLayout>
  );
}
