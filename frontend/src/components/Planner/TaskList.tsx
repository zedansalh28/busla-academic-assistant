import React from 'react';
import { StudyTask } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Circle, Trash2 } from 'lucide-react';

interface TaskListProps {
  tasks: StudyTask[];
  onUpdateTask: (taskId: string, updates: Partial<StudyTask>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  loading?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onUpdateTask,
  onDeleteTask,
  loading = false,
}) => {
  const handleStatusToggle = async (task: StudyTask) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await onUpdateTask(task.id, { status: newStatus });
  };

  if (!tasks.length) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        <p className="text-lg">No tasks yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`bg-white rounded-lg shadow p-4 flex items-start space-x-4 transition-opacity ${
            task.status === 'completed' ? 'opacity-60' : ''
          }`}
        >
          <button
            onClick={() => handleStatusToggle(task)}
            disabled={loading}
            className="flex-shrink-0 mt-1 text-primary hover:text-primary-dark transition-colors disabled:opacity-50"
          >
            {task.status === 'completed' ? (
              <CheckCircle2 size={24} className="text-accent" />
            ) : (
              <Circle size={24} />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold ${
                task.status === 'completed'
                  ? 'line-through text-gray-500'
                  : 'text-secondary'
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
            )}
            {task.due_date && (
              <p className="text-xs text-gray-500 mt-2">
                Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                {' '}({formatDistanceToNow(new Date(task.due_date), { addSuffix: true })})
              </p>
            )}
          </div>

          <button
            onClick={() => {
              if (confirm(`Delete "${task.title}"?`)) onDeleteTask(task.id);
            }}
            disabled={loading}
            className="flex-shrink-0 text-gray-400 hover:text-danger transition-colors disabled:opacity-50"
          >
            <Trash2 size={20} />
          </button>
        </div>
      ))}
    </div>
  );
};
