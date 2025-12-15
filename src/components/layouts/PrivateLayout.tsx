import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../common/Header';
import { FloatingChat } from '../chat';
import { useAuth } from '../../context/AuthContext';

// Roles that can use chat (support both enum names and display names)
const CHAT_ENABLED_ROLES = ['Admin', 'Manager', 'TA', 'Accountant', 'Sale', 'Staff TA', 'Staff Sales', 'Staff Accountant'];

const PrivateLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Check if user can use chat and not already on chat page
  const canUseChat = user && CHAT_ENABLED_ROLES.includes(user.role);
  const isOnChatPage = location.pathname === '/chat';

  // Private layout không hiển thị public branding (menu public)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showPublicBranding={false} />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Floating Chat Widget - only for internal staff and not on chat page */}
      {canUseChat && !isOnChatPage && <FloatingChat />}
    </div>
  );
};

export default PrivateLayout;

