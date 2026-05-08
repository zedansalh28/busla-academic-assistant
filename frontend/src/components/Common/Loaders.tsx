import React from 'react';

export const Loading: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
};

export const ErrorAlert: React.FC<{ message: string; onDismiss?: () => void }> = ({
  message,
  onDismiss,
}) => {
  return (
    <div className="bg-danger bg-opacity-10 border border-danger rounded-lg p-4 flex items-center justify-between">
      <p className="text-danger font-medium">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-danger hover:text-red-700 font-bold text-xl"
        >
          ✕
        </button>
      )}
    </div>
  );
};
