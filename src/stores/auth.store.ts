import { create } from "zustand";
import { pb } from "@/lib/pocketbase";
import {
  DEFAULT_PREFERENCES,
  type Preferences,
  type TriageUser,
} from "@/lib/types";
import type { RecordModel } from "pocketbase";

function mapUser(record: RecordModel): TriageUser {
  const prefs = (record.preferences ?? null) as Partial<Preferences> | null;
  return {
    id: record.id,
    created: record.created,
    updated: record.updated,
    email: record.email ?? "",
    name: record.name ?? "",
    onboardingComplete: !!record.onboardingComplete,
    preferences: prefs ? { ...DEFAULT_PREFERENCES, ...prefs } : null,
  };
}

interface AuthState {
  user: TriageUser | null;
  ready: boolean;
  error: string | null;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  updatePreferences: (patch: Partial<Preferences>) => Promise<void>;
  patchUser: (patch: Partial<Pick<TriageUser, "name" | "onboardingComplete">>) => Promise<void>;
  preferences: () => Preferences;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  ready: false,
  error: null,

  init: async () => {
    if (pb.authStore.isValid && pb.authStore.record) {
      try {
        const record = await pb.collection("users").authRefresh();
        set({ user: mapUser(record.record), ready: true });
        return;
      } catch {
        pb.authStore.clear();
      }
    }
    set({ user: null, ready: true });
  },

  login: async (email, password) => {
    set({ error: null });
    try {
      const auth = await pb
        .collection("users")
        .authWithPassword(email.trim(), password);
      set({ user: mapUser(auth.record) });
    } catch (e) {
      set({ error: "Incorrect email or password." });
      throw e;
    }
  },

  register: async (name, email, password) => {
    set({ error: null });
    try {
      await pb.collection("users").create({
        name: name.trim(),
        email: email.trim(),
        password,
        passwordConfirm: password,
        onboardingComplete: false,
        preferences: DEFAULT_PREFERENCES,
      });
      await get().login(email, password);
    } catch (e: unknown) {
      const message =
        (e as { response?: { data?: Record<string, { message?: string }> } })
          ?.response?.data?.email?.message ??
        "Could not create your account. Try a different email.";
      set({ error: message });
      throw e;
    }
  },

  logout: () => {
    pb.authStore.clear();
    set({ user: null });
  },

  refresh: async () => {
    const id = get().user?.id;
    if (!id) return;
    const record = await pb.collection("users").getOne(id);
    set({ user: mapUser(record) });
  },

  updatePreferences: async (patch) => {
    const user = get().user;
    if (!user) return;
    const next = { ...get().preferences(), ...patch };
    // Optimistic update
    set({ user: { ...user, preferences: next } });
    const record = await pb
      .collection("users")
      .update(user.id, { preferences: next });
    set({ user: mapUser(record) });
  },

  patchUser: async (patch) => {
    const user = get().user;
    if (!user) return;
    set({ user: { ...user, ...patch } });
    const record = await pb.collection("users").update(user.id, patch);
    set({ user: mapUser(record) });
  },

  preferences: () => get().user?.preferences ?? DEFAULT_PREFERENCES,
}));
