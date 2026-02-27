import type { AppStorage, Conversation, Folder, ProjectMeta, UserProfile } from "@/types";

// ---------------------------------------------------------------------------
// Global storage — project list + active project (shared, not per-project)
// ---------------------------------------------------------------------------
const GLOBAL_KEY = "cofunder_global_v1";
const CURRENT_VERSION = 1;

interface GlobalData {
  activeProjectId: string | null;
  projects: ProjectMeta[];
}

function getGlobalData(): GlobalData {
  if (typeof window === "undefined") return { activeProjectId: null, projects: [] };
  try {
    const raw = localStorage.getItem(GLOBAL_KEY);
    if (!raw) return { activeProjectId: null, projects: [] };
    return JSON.parse(raw) as GlobalData;
  } catch {
    return { activeProjectId: null, projects: [] };
  }
}

function setGlobalData(data: GlobalData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GLOBAL_KEY, JSON.stringify(data));
}

export function getAllProjects(): ProjectMeta[] {
  return getGlobalData().projects;
}

export function getActiveProjectId(): string | null {
  return getGlobalData().activeProjectId;
}

export function setActiveProject(id: string): void {
  const data = getGlobalData();
  data.activeProjectId = id;
  setGlobalData(data);
}

export function addProject(meta: ProjectMeta): void {
  const data = getGlobalData();
  data.projects = [...data.projects.filter((p) => p.id !== meta.id), meta];
  data.activeProjectId = meta.id;
  setGlobalData(data);
}

export function updateProjectMeta(id: string, updates: Partial<Pick<ProjectMeta, "name" | "company">>): void {
  const data = getGlobalData();
  data.projects = data.projects.map((p) => (p.id === id ? { ...p, ...updates } : p));
  setGlobalData(data);
}

export function deleteProject(id: string): void {
  const data = getGlobalData();
  data.projects = data.projects.filter((p) => p.id !== id);
  if (data.activeProjectId === id) {
    data.activeProjectId = data.projects[0]?.id ?? null;
  }
  setGlobalData(data);
  // Also remove per-project data
  if (typeof window !== "undefined") {
    localStorage.removeItem(`cofunder_app_v1_${id}`);
  }
}

// ---------------------------------------------------------------------------
// Per-project storage — profile + conversations + folders
// ---------------------------------------------------------------------------

function projectStorageKey(projectId: string): string {
  return `cofunder_app_v1_${projectId}`;
}

function getStorage(projectId: string): AppStorage {
  if (typeof window === "undefined") {
    return { version: CURRENT_VERSION, userProfile: null, conversations: {}, customFolders: [] };
  }
  try {
    const raw = localStorage.getItem(projectStorageKey(projectId));
    if (!raw) return { version: CURRENT_VERSION, userProfile: null, conversations: {}, customFolders: [] };
    return JSON.parse(raw) as AppStorage;
  } catch {
    return { version: CURRENT_VERSION, userProfile: null, conversations: {}, customFolders: [] };
  }
}

function setStorage(projectId: string, data: AppStorage): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(projectStorageKey(projectId), JSON.stringify(data));
}

// Convenience: get active project id (throws if none)
function requireActiveProject(): string {
  const id = getActiveProjectId();
  if (!id) throw new Error("Brak aktywnego projektu");
  return id;
}

// User Profile
export function getUserProfile(): UserProfile | null {
  try {
    return getStorage(requireActiveProject()).userProfile;
  } catch {
    return null;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  const id = requireActiveProject();
  const storage = getStorage(id);
  storage.userProfile = profile;
  setStorage(id, storage);
}

export function updateUserProfile(updates: Partial<UserProfile>): void {
  const id = requireActiveProject();
  const storage = getStorage(id);
  if (storage.userProfile) {
    storage.userProfile = { ...storage.userProfile, ...updates };
    setStorage(id, storage);
  }
}

// Conversations
export function getConversation(convId: string): Conversation | null {
  try {
    return getStorage(requireActiveProject()).conversations[convId] ?? null;
  } catch {
    return null;
  }
}

export function getAllConversations(): Conversation[] {
  try {
    const storage = getStorage(requireActiveProject());
    return Object.values(storage.conversations).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  } catch {
    return [];
  }
}

export function saveConversation(conversation: Conversation): void {
  const id = requireActiveProject();
  const storage = getStorage(id);
  storage.conversations[conversation.id] = conversation;
  setStorage(id, storage);
}

export function deleteConversation(convId: string): void {
  const id = requireActiveProject();
  const storage = getStorage(id);
  delete storage.conversations[convId];
  setStorage(id, storage);
}

// Custom Folders
export function getCustomFolders(): Folder[] {
  try {
    return getStorage(requireActiveProject()).customFolders;
  } catch {
    return [];
  }
}

export function saveCustomFolder(folder: Folder): void {
  const id = requireActiveProject();
  const storage = getStorage(id);
  const idx = storage.customFolders.findIndex((f) => f.slug === folder.slug);
  if (idx >= 0) {
    storage.customFolders[idx] = folder;
  } else {
    storage.customFolders.push(folder);
  }
  setStorage(id, storage);
}

export function deleteCustomFolder(slug: string): void {
  const id = requireActiveProject();
  const storage = getStorage(id);
  storage.customFolders = storage.customFolders.filter((f) => f.slug !== slug);
  setStorage(id, storage);
}

// Reset current project's conversations only
export function resetConversations(): void {
  const id = requireActiveProject();
  const storage = getStorage(id);
  storage.conversations = {};
  setStorage(id, storage);
}

// Reset current project's all data (profile + conversations)
export function resetAllData(): void {
  const id = getActiveProjectId();
  if (!id || typeof window === "undefined") return;
  localStorage.removeItem(projectStorageKey(id));
  deleteProject(id);
}
