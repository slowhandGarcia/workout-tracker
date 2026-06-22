import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useProfileStore } from "@/store/useProfileStore";
import { useWorkoutStore } from "@/store/useWorkoutStore";

interface AuthStore {
  isGuest: boolean;
  setGuest: (isGuest: boolean) => void;
  /** Signed-in user signing out: drop the account email, keep their data, revert to guest. */
  logout: () => void;
  /** Guest wiping their local data: clear profile + all workouts, stay in guest mode. */
  resetGuestData: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isGuest: true,
      setGuest: (isGuest) => set({ isGuest }),
      logout: () => {
        useProfileStore.getState().setEmail(undefined);
        set({ isGuest: true });
      },
      resetGuestData: () => {
        useProfileStore.getState().resetProfile();
        useWorkoutStore.getState().clearAllWorkouts();
        set({ isGuest: true });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
