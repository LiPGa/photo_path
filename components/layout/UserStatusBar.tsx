import React from 'react';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface UserStatusBarProps {
  onLoginClick: () => void;
}

export const UserStatusBar: React.FC<UserStatusBarProps> = ({ onLoginClick }) => {
  const { user, signOut } = useAuth();

  return (
    <div className="fixed top-4 right-4 z-40 flex items-center gap-3">
      {user ? (
        <div className="flex items-center gap-3 bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-full pl-4 pr-2 py-1.5">
          <span className="text-xs text-zinc-400 hidden sm:block">
            {user.email?.split('@')[0]}
          </span>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-full"
          >
            <LogOut size={12} />
            <span className="hidden sm:inline">退出</span>
          </button>
        </div>
      ) : (
        <button
          onClick={onLoginClick}
          className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-sm border border-white/10 hover:border-[#D40000]/50 rounded-full px-4 py-2 text-sm text-zinc-400 hover:text-white transition-all"
        >
          <User size={16} />
          <span>登录</span>
        </button>
      )}
    </div>
  );
};
