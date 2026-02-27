import type { AppStorage, Conversation, Folder, UserProfile } from "@/types";

const STORAGE_KEY = "cofunder_app_v1";
const CURRENT_VERSION = 1;

function getStorage(): AppStorage {
  if (typeof window === "undefined") {
    return { version: CURRENT_VERSION, userProfile: null, conversations: {}, customFolders: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: CURRENT_VERSION, userProfile: null, conversations: {}, customFolders: [] };
    return JSON.parse(raw) as AppStorage;
  } catch {
    return { version: CURRENT_VERSION, userProfile: null, conversations: {}, customFolders: [] };
  }
}

function setStorage(data: AppStorage): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// User Profile
export function getUserProfile(): UserProfile | null {
  return getStorage().userProfile;
}

export function saveUserProfile(profile: UserProfile): void {
  const storage = getStorage();
  storage.userProfile = profile;
  setStorage(storage);
}

export function updateUserProfile(updates: Partial<UserProfile>): void {
  const storage = getStorage();
  if (storage.userProfile) {
    storage.userProfile = { ...storage.userProfile, ...updates };
    setStorage(storage);
  }
}

// Conversations
export function getConversation(id: string): Conversation | null {
  return getStorage().conversations[id] ?? null;
}

export function getAllConversations(): Conversation[] {
  const storage = getStorage();
  return Object.values(storage.conversations).sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
}

export function saveConversation(conversation: Conversation): void {
  const storage = getStorage();
  storage.conversations[conversation.id] = conversation;
  setStorage(storage);
}

export function deleteConversation(id: string): void {
  const storage = getStorage();
  delete storage.conversations[id];
  setStorage(storage);
}

// Custom Folders
export function getCustomFolders(): Folder[] {
  return getStorage().customFolders;
}

export function saveCustomFolder(folder: Folder): void {
  const storage = getStorage();
  const idx = storage.customFolders.findIndex((f) => f.slug === folder.slug);
  if (idx >= 0) {
    storage.customFolders[idx] = folder;
  } else {
    storage.customFolders.push(folder);
  }
  setStorage(storage);
}

export function deleteCustomFolder(slug: string): void {
  const storage = getStorage();
  storage.customFolders = storage.customFolders.filter((f) => f.slug !== slug);
  setStorage(storage);
}

// Reset
export function resetAllData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function resetConversations(): void {
  const storage = getStorage();
  storage.conversations = {};
  setStorage(storage);
}
