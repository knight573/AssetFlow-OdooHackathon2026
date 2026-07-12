import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { Profile, UserRole } from './types';
import { getMockData, setMockData } from './mockDb';

interface AuthContextType {
  user: any;
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, name: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchProfile: (profileId: string) => void;
  allProfiles: Profile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>('employee');
  const [loading, setLoading] = useState(true);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);

  // Sync Profiles list from mockDb or Supabase
  const refreshProfiles = () => {
    const list = getMockData<Profile>('profiles');
    setAllProfiles(list);
    return list;
  };

  useEffect(() => {
    // Listen for mock DB changes
    const handleDbChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.table === 'profiles') {
        refreshProfiles();
      }
    };
    window.addEventListener('mock-db-change', handleDbChange);

    const list = refreshProfiles();

    // Check session
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setUser(session.user);
          fetchSupabaseProfile(session.user.id);
        } else {
          // If no supabase session, fall back to mock logged in user (let's use Priya Shah as default)
          loadDefaultMockUser(list);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setUser(session.user);
          fetchSupabaseProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setRole('employee');
          setLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
        window.removeEventListener('mock-db-change', handleDbChange);
      };
    } else {
      // Local mock only
      loadDefaultMockUser(list);
      setLoading(false);
      return () => {
        window.removeEventListener('mock-db-change', handleDbChange);
      };
    }
  }, []);

  const loadDefaultMockUser = (profilesList: Profile[]) => {
    const savedUserId = localStorage.getItem('assetflow_current_user_id');
    const current = profilesList.find(p => p.id === savedUserId) || profilesList[0];
    if (current) {
      setUser({ id: current.id, email: current.email });
      setProfile(current);
      setRole(current.role);
    }
    setLoading(false);
  };

  const fetchSupabaseProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
      
      if (error) throw error;
      if (data) {
        setProfile(data as Profile);
        setRole(data.role as UserRole);
      }
    } catch (err) {
      console.error("Error fetching profile from Supabase:", err);
      // Fallback
      const list = getMockData<Profile>('profiles');
      const found = list.find(p => p.id === uid);
      if (found) {
        setProfile(found);
        setRole(found.role);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password?: string) => {
    setLoading(true);
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signInWithPassword({ email, password: password || 'password123' });
      if (error) throw error;
    } else {
      const list = getMockData<Profile>('profiles');
      const found = list.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (!found) {
        setLoading(false);
        throw new Error("No profile found with this email. Please sign up first.");
      }
      
      const storedPassword = found.password || 'password123';
      if (password && password !== storedPassword) {
        setLoading(false);
        throw new Error("Incorrect password. Please try again.");
      }

      localStorage.setItem('assetflow_current_user_id', found.id);
      setUser({ id: found.id, email: found.email });
      setProfile(found);
      setRole(found.role);
      setLoading(false);
    }
  };

  const signup = async (email: string, name: string, password?: string) => {
    setLoading(true);
    const newId = crypto.randomUUID();
    const newProfile: Profile = {
      id: newId,
      name,
      email,
      department_id: null,
      role: 'employee',
      status: 'active',
      created_at: new Date().toISOString(),
      password: password || 'password123'
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signUp({
        email,
        password: password || 'password123',
        options: { data: { name } }
      });
      if (error) throw error;
    } else {
      const list = getMockData<Profile>('profiles');
      if (list.some(p => p.email.toLowerCase() === email.toLowerCase())) {
        setLoading(false);
        throw new Error("User with this email already exists!");
      }
      list.push(newProfile);
      setMockData('profiles', list);
      localStorage.setItem('assetflow_current_user_id', newId);
      setUser({ id: newId, email });
      setProfile(newProfile);
      setRole('employee');
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('assetflow_current_user_id');
      setUser(null);
      setProfile(null);
      setRole('employee');
    }
    setLoading(false);
  };

  const switchProfile = (profileId: string) => {
    const list = getMockData<Profile>('profiles');
    const found = list.find(p => p.id === profileId);
    if (found) {
      localStorage.setItem('assetflow_current_user_id', found.id);
      setUser({ id: found.id, email: found.email });
      setProfile(found);
      setRole(found.role);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, login, signup, logout, switchProfile, allProfiles }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
