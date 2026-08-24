import React, { useState } from 'react';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';

export const AuthModal = ({ isOpen, onClose, initialTab = 'signin', onAuthenticated }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  if (activeTab === 'register' || activeTab === 'signup') {
    return (
      <RegisterModal
        isOpen={isOpen}
        onClose={onClose}
        onSwitchToLogin={() => setActiveTab('signin')}
        onRegistered={(user) => {
          if (onAuthenticated) onAuthenticated(user);
        }}
      />
    );
  }

  return (
    <LoginModal
      isOpen={isOpen}
      onClose={onClose}
      onSwitchToRegister={() => setActiveTab('register')}
    />
  );
};

export default AuthModal;
