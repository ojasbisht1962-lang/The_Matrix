// ============================================
// Topbar — header component
// Profile info, avatar dropdown, notifications
// ============================================

import { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, User, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, selectProfile } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { signOut } from '../../services/auth.service';
import { toast } from 'sonner';
import styles from './Topbar.module.css';

export function Topbar() {
  const profile = useAuthStore(selectProfile);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/auth/login');
    } catch (err) {
      toast.error(err.message || 'Failed to sign out');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className={styles.topbar}>
      <button
        className={styles.mobileMenuBtn}
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      <div className={styles.searchPlaceholder}>
        {/* Placeholder/spacing for page header search tools or app info */}
      </div>

      <div className={styles.actions}>
        {/* Notifications Icon (DevD will implement functionality) */}
        <button
          className={styles.notificationBtn}
          onClick={() => navigate('/notifications')}
          aria-label="View notifications"
        >
          <Bell size={20} />
          {/* Badge indicator could go here if notifications count exists */}
        </button>

        {/* User profile dropdown */}
        <div className={styles.userMenu} ref={dropdownRef}>
          <button
            className={styles.profileBtn}
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="User menu"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'User avatar'}
                className={styles.avatar}
              />
            ) : (
              <span className={styles.avatarInitials}>
                {getInitials(profile?.full_name)}
              </span>
            )}
            <span className={styles.userName}>{profile?.full_name}</span>
          </button>

          {dropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <p className={styles.dropdownName}>{profile?.full_name}</p>
                <p className={styles.dropdownEmail}>{profile?.email}</p>
                <span className={styles.dropdownRoleTag}>
                  {profile?.role?.replace('_', ' ')}
                </span>
              </div>
              <div className={styles.dropdownDivider} />
              <button
                className={styles.dropdownItem}
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/org-setup'); // Default profile settings location for now
                }}
              >
                <User size={16} />
                <span>Profile Settings</span>
              </button>
              <button
                className={[styles.dropdownItem, styles.signOutBtn].join(' ')}
                onClick={handleSignOut}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
