import React from 'react';
import { Outlet } from 'react-router-dom';

const PublicFormLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Outlet />
    </div>
  );
};

export default PublicFormLayout;