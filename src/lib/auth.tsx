import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from './types';
import { stateDb } from './supabase';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  loginMock: (email: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize with a default profile (Admin User or Arjun Nair)
  useEffect(() => {
    const savedUserId = localStorage.getItem('af_current_user_id');
    const profiles = stateDb.get<Profile>('af_profiles');
    
    // Default to Priya Shah (Department Head) or Rohan Gupta (Employee)
    const initialUserId = savedUserId || 'p1'; // Admin by default for testing
    const foundProfile = profiles.find(p => p.id === initialUserId);
    
    if (foundProfile) {
      setUser({ id: foundProfile.id, email: foundProfile.email });
      setProfile(foundProfile);
    } else if (profiles.length > 0) {
      setUser({ id: profiles[0].id, email: profiles[0].email });
      setProfile(profiles[0]);
    }
    setLoading(false);
  }, []);

  const loginMock = async (email: string): Promise<boolean> => {
    setLoading(true);
    const profiles = stateDb.get<Profile>('af_profiles');
    const found = profiles.find(p => p.email.toLowerCase() === email.toLowerCase() && p.status === 'active');
    if (found) {
      setUser({ id: found.id, email: found.email });
      setProfile(found);
      localStorage.setItem('af_current_user_id', found.id);
      setLoading(false);
      return true;
    }
    setLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('af_current_user_id');
  };

  const switchRole = (newRole: UserRole) => {
    if (profile) {
      // Temporarily switch role in current memory session (and update in local storage profiles)
      const updatedProfile = { ...profile, role: newRole };
      setProfile(updatedProfile);
      
      const profiles = stateDb.get<Profile>('af_profiles');
      const idx = profiles.findIndex(p => p.id === profile.id);
      if (idx !== -1) {
        profiles[idx].role = newRole;
        stateDb.set('af_profiles', profiles);
      }
    }
  };

  const role = profile ? profile.role : null;

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, loginMock, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
