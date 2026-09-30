import React, { createContext, useContext, useEffect, useState } from 'react';
import { SCALE } from './theme';
import {
  Profile,
  defaultProfile,
  loadProfile,
  saveProfile,
  resetAll,
} from './storage';

type Ctx = {
  profile: Profile;
  loaded: boolean;
  error: string;
  update: (patch: Partial<Profile>) => Promise<void>;
  reset: () => Promise<void>;
  fs: (n: number) => number;
};

const ProfileCtx = createContext<Ctx>(null as unknown as Ctx);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile()
      .then((p) => setProfile(p))
      .catch((e: any) => setError('Could not load saved data: ' + (e?.message ?? String(e))))
      .finally(() => setLoaded(true));
  }, []);

  const update = async (patch: Partial<Profile>) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    try {
      await saveProfile(next);
      setError('');
    } catch (e: any) {
      setError('Could not save: ' + (e?.message ?? String(e)));
    }
  };

  const reset = async () => {
    try {
      await resetAll();
      setError('');
    } catch (e: any) {
      setError('Could not reset: ' + (e?.message ?? String(e)));
    }
    setProfile(defaultProfile);
  };

  const scale = SCALE[profile.textSize];
  const fs = (n: number) => Math.round(n * scale);

  return (
    <ProfileCtx.Provider value={{ profile, loaded, error, update, reset, fs }}>
      {children}
    </ProfileCtx.Provider>
  );
}

export const useProfile = () => useContext(ProfileCtx);