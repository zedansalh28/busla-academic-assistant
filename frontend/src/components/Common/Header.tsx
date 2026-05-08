import React from 'react';

export const Header: React.FC<{ title?: string }> = ({ title = 'Busla' }) => {
  return (
    <header className="bg-primary text-white py-4 px-6 shadow-md">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm text-blue-100">Your AI Academic Assistant</p>
    </header>
  );
};
