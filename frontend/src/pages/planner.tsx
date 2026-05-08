import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { usePlans, useTasks } from '@/hooks/usePlans';
import { DashboardLayout } from '@/components/Common/DashboardLayout';
import { PlanList, TaskList, AddTaskModal } from '@/components/Planner';
import { Loading, Modal } from '@/components/Common';
import { Plus, ArrowLeft } from 'lucide-react';
import { StudyPlan } from '@/types';

export default function Planner() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { plans, loading: plansLoading, createPlan, deletePlan, refresh: refreshPlans } = usePlans(user?.id || null);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const { tasks, loading: tasksLoading, addTask, updateTask, deleteTask } = useTasks(
    selectedPlan?.id || null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Keep selectedPlan in sync when plans refresh after progress recalculation
  useEffect(() => {
    if (selectedPlan) {
      const updated = plans.find((p) => p.id === selectedPlan.id);
      if (updated) setSelectedPlan(updated);
    }
  }, [plans]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading || !user) {
    return <Loading />;
  }

  // Compute progress directly from local task state for immediate UI feedback
  const computedProgress = tasks.length > 0
    ? Math.round(tasks.filter((t) => t.status === 'completed').length / tasks.length * 100)
    : 0;

  const handleCreatePlan = async (data: any) => {
    await createPlan(data);
    setShowCreateModal(false);
  };

  const handleAddTask = async (data: any) => {
    if (selectedPlan) {
      await addTask({ ...data, plan_id: selectedPlan.id });
      await refreshPlans();
      setShowTaskModal(false);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: any) => {
    await updateTask(taskId, updates);
    await refreshPlans();
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    await refreshPlans();
  };

  return (
    <DashboardLayout onLogout={logout} title="Study Planner">
      <div className="space-y-6">
        {!selectedPlan ? (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-secondary">Your Study Plans</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>New Plan</span>
              </button>
            </div>
            <PlanList
              plans={plans}
              onSelectPlan={setSelectedPlan}
              onDeletePlan={deletePlan}
              loading={plansLoading}
            />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedPlan(null)}
                className="flex items-center space-x-2 text-primary hover:text-blue-700 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Plans</span>
              </button>
              <h2 className="text-2xl font-bold text-secondary flex-1 text-center">
                {selectedPlan.title}
              </h2>
              <div className="w-20"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="text-3xl font-bold text-primary mb-1">{computedProgress}%</div>
                <p className="text-sm text-gray-600">Progress</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${computedProgress}%` }}
                  />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="text-3xl font-bold text-accent mb-1">{tasks.length}</div>
                <p className="text-sm text-gray-600">Total Tasks</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="text-3xl font-bold text-secondary mb-1">
                  {tasks.filter((t) => t.status === 'completed').length}
                </div>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-secondary">Tasks</h3>
              <button
                onClick={() => setShowTaskModal(true)}
                className="btn-primary flex items-center space-x-2 text-sm"
              >
                <Plus size={18} />
                <span>Add Task</span>
              </button>
            </div>

            <TaskList
              tasks={tasks}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              loading={tasksLoading}
            />
          </>
        )}

        <Modal
          isOpen={showCreateModal}
          title="Create New Study Plan"
          onClose={() => setShowCreateModal(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const deadlineStr = formData.get('deadline') as string;
              handleCreatePlan({
                title: formData.get('title') as string,
                subject: formData.get('subject') as string,
                deadline: deadlineStr ? new Date(deadlineStr).getTime() : 0,
                milestones: [],
                progress: 0,
              });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Title</label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g., Calculus Midterm Prep"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                name="subject"
                required
                placeholder="e.g., Mathematics"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input
                type="date"
                name="deadline"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button type="submit" className="flex-1 btn-primary">
                Create Plan
              </button>
            </div>
          </form>
        </Modal>

        <AddTaskModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          onAdd={handleAddTask}
          loading={tasksLoading}
        />
      </div>
    </DashboardLayout>
  );
}
