import { create } from 'zustand';
import { collection, doc, onSnapshot, setDoc, updateDoc, writeBatch, deleteDoc, deleteField } from 'firebase/firestore';
import { db, auth } from './firebase';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  goalId: string;
  title: string;
  status: TaskStatus;
  durationMinutes: number;
  impactScore: number;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  createdAt: any; // Allow Timestamp or Date
  deadline?: any;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: any;
  progress: number;
  successProbability: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  createdAt: any;
  aiSummary?: string;
  aiRiskExplanation?: string;
  aiRecoveryPlan?: {
    recommendations: string[];
    revisedPriorities: string[];
    focusActions: string[];
    newSchedule: ScheduleDay[];
  };
  estimatedTotalHours?: number;
  aiActivityLog?: { timestamp: any; trigger: string; summary: string }[];
  isGenerating?: boolean;
}

export interface ScheduleDay {
  day: string;
  tasks: {
    taskTitle: string;
    hours: number;
    startTime?: string; // e.g., "09:00"
    endTime?: string;   // e.g., "12:00"
  }[];
}

export interface Schedule {
  goalId: string;
  days: ScheduleDay[];
  lastSyncedScheduleHash?: string; // Used to detect if schedule changed since last calendar sync
}

export interface WorkingWindow {
  label: string;
  start: string; // HH:mm
  end: string;   // HH:mm
}

export interface CalendarSyncStatus {
  isSynced: boolean;
  lastSyncTime: string | null;
}

interface FocusState {
  uid: string | null;
  goals: Goal[];
  tasks: Task[];
  schedules: Record<string, Schedule>;
  activeMode: 'Focus' | 'Coach' | 'Accountability';
  dailyBriefing: string;
  hasCompletedOnboarding: boolean;
  preferredVoiceURI: string | null;
  workingWindow: WorkingWindow | null;
  calendarStatus: CalendarSyncStatus;
  notifications: { id: string; message: string }[];
  
  initializeSync: (uid: string) => void;
  
  // Actions
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  removeGoal: (goalId: string) => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  setSchedule: (goalId: string, schedule: Schedule) => Promise<void>;
  setActiveMode: (mode: 'Focus' | 'Coach' | 'Accountability') => Promise<void>;
  setDailyBriefing: (briefing: string) => void;
  setPreferredVoiceURI: (uri: string) => Promise<void>;
  setWorkingWindow: (window: WorkingWindow) => Promise<void>;
  setCalendarStatus: (status: CalendarSyncStatus) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  
  addNotification: (message: string) => void;
  removeNotification: (id: string) => void;
}

const parseTimestamps = (data: any) => {
  const result = { ...data };
  for (const key in result) {
    if (result[key] && typeof result[key].toDate === 'function') {
      result[key] = result[key].toDate().toISOString();
    }
  }
  return result;
};

// Helper for Adaptive AI Loop
const calculateAdaptiveUpdates = (state: FocusState, goalId: string, trigger: string): Partial<FocusState> => {
  const goalTasks = state.tasks.filter(t => t.goalId === goalId);
  const goal = state.goals.find(g => g.id === goalId);
  if (!goal) return {};

  let progressRatio = 0;
  if (goalTasks.length > 0) {
    const completed = goalTasks.filter(t => t.status === 'done').length;
    progressRatio = completed / goalTasks.length;
  }
  
  let probability = Math.round(progressRatio * 100);
  
  const now = new Date();
  const deadline = new Date(goal.deadline);
  let timeRatio = 0;
  
  if (goal.createdAt && deadline) {
    const totalTime = deadline.getTime() - new Date(goal.createdAt).getTime();
    const timeElapsed = now.getTime() - new Date(goal.createdAt).getTime();
    if (totalTime > 0) {
      timeRatio = Math.max(0, Math.min(1, timeElapsed / totalTime));
    }
  }

  if (timeRatio > progressRatio) {
    probability = Math.max(5, probability - Math.round((timeRatio - progressRatio) * 50));
  } else {
    probability = Math.min(99, probability + Math.round((progressRatio - timeRatio) * 20));
  }

  let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
  if (probability < 30) riskLevel = 'Critical';
  else if (probability < 50) riskLevel = 'High';
  else if (probability < 75) riskLevel = 'Medium';

  let summary = `Updated success probability to ${probability}% and risk level to ${riskLevel}.`;
  
  let aiRecoveryPlan = goal.aiRecoveryPlan;
  let aiRiskExplanation = goal.aiRiskExplanation;
  
  if ((riskLevel === 'Low' || riskLevel === 'Medium') && aiRecoveryPlan) {
    aiRecoveryPlan = undefined;
    aiRiskExplanation = undefined;
    summary += " Risk stabilized, clearing recovery plan.";
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    trigger,
    summary
  };

  const newLog = [...(goal.aiActivityLog || []), logEntry];
  if (newLog.length > 15) newLog.shift();

  const newGoals = state.goals.map(g => 
    g.id === goalId ? { 
      ...g, 
      successProbability: probability, 
      riskLevel, 
      progress: Math.round(progressRatio * 100),
      aiRecoveryPlan,
      aiRiskExplanation,
      aiActivityLog: newLog
    } : g
  );

  const newNotif = { id: Date.now().toString() + Math.random().toString(), message: "✨ FocusFlow AI updated your execution plan." };
  
  return { 
    goals: newGoals,
    notifications: [...state.notifications, newNotif]
  };
};

export const useStore = create<FocusState>((set, get) => ({
  uid: null,
  goals: [],
  tasks: [],
  schedules: {},
  activeMode: 'Coach',
  dailyBriefing: "Welcome to FocusFlow AI!",
  hasCompletedOnboarding: false,
  preferredVoiceURI: null,
  workingWindow: null,
  calendarStatus: { isSynced: false, lastSyncTime: null },
  notifications: [],
  
  initializeSync: (uid: string) => {
    set({ uid });
    
    // Preferences listener
    onSnapshot(doc(db, `users/${uid}/preferences/settings`), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        set({ 
          activeMode: data.activeMode || 'Coach', 
          preferredVoiceURI: data.preferredVoiceURI || null,
          workingWindow: data.workingWindow || null,
          calendarStatus: data.calendarStatus || { isSynced: false, lastSyncTime: null }
        });
      }
    });

    // Profile listener
    onSnapshot(doc(db, `users/${uid}/profile/data`), (docSnap) => {
      if (docSnap.exists()) {
        set({ hasCompletedOnboarding: docSnap.data().hasCompletedOnboarding || false });
      }
    });

    // Goals listener
    onSnapshot(collection(db, `users/${uid}/goals`), (goalSnap) => {
      const goals = goalSnap.docs.map(d => ({ id: d.id, ...parseTimestamps(d.data()) } as Goal));
      set({ goals });
      
      goalSnap.docChanges().forEach(change => {
        const goalId = change.doc.id;
        if (change.type === 'added') {
          // Tasks listener per goal
          onSnapshot(collection(db, `users/${uid}/goals/${goalId}/tasks`), (taskSnap) => {
            const newTasks = taskSnap.docs.map(td => ({ id: td.id, ...parseTimestamps(td.data()) } as Task));
            set(state => {
              const otherTasks = state.tasks.filter(t => t.goalId !== goalId);
              return { tasks: [...otherTasks, ...newTasks] };
            });
          });
          
          // Schedule listener per goal
          onSnapshot(collection(db, `users/${uid}/goals/${goalId}/schedule`), (schedSnap) => {
            if (!schedSnap.empty) {
              const scheduleDoc = schedSnap.docs[0];
              const days = scheduleDoc.data().days || [];
              set(state => ({ schedules: { ...state.schedules, [goalId]: { goalId, days } } }));
            }
          });
        }
      });
    });
  },
  
  addGoal: async (goal) => {
    const uid = get().uid;
    if (!uid) return;
    await setDoc(doc(db, `users/${uid}/goals`, goal.id), goal);
  },
  
  updateGoal: async (id, updates) => {
    const state = get();
    const uid = state.uid;
    if (!uid) return;
    
    let trigger = "Goal edited";
    if (updates.deadline) trigger = "Deadline changed";
    else if (updates.estimatedTotalHours) trigger = "Available hours changed";
    
    // Predict adaptive loop changes if deadline changes
    let payload: any = { ...updates };
    if (updates.deadline || updates.estimatedTotalHours) {
      const newGoals = state.goals.map((g) => g.id === id ? { ...g, ...updates } as Goal : g);
      const stateWithUpdatedGoal = { ...state, goals: newGoals };
      const adaptiveUpdates = calculateAdaptiveUpdates(stateWithUpdatedGoal, id, trigger);
      
      const updatedGoal = adaptiveUpdates.goals?.find(g => g.id === id);
      if (updatedGoal) {
        payload.successProbability = updatedGoal.successProbability;
        payload.riskLevel = updatedGoal.riskLevel;
        payload.progress = updatedGoal.progress;
        payload.aiActivityLog = updatedGoal.aiActivityLog;
        if (updatedGoal.aiRecoveryPlan === undefined) payload.aiRecoveryPlan = deleteField();
        if (updatedGoal.aiRiskExplanation === undefined) payload.aiRiskExplanation = deleteField();
      }
      if (adaptiveUpdates.notifications) {
        set({ notifications: adaptiveUpdates.notifications });
      }
    }
    await updateDoc(doc(db, `users/${uid}/goals`, id), payload);
  },
  
  removeGoal: async (goalId) => {
    const state = get();
    const uid = state.uid;
    if (!uid) return;
    
    const tasksToRemove = state.tasks.filter(t => t.goalId === goalId);
    const batch = writeBatch(db);
    batch.delete(doc(db, `users/${uid}/goals`, goalId));
    tasksToRemove.forEach(task => {
      batch.delete(doc(db, `users/${uid}/goals/${goalId}/tasks`, task.id));
    });
    
    await batch.commit();
    set(s => ({
      goals: s.goals.filter(g => g.id !== goalId),
      tasks: s.tasks.filter(t => t.goalId !== goalId)
    }));
  },
  
  addTask: async (task) => {
    const state = get();
    const uid = state.uid;
    if (!uid) return;

    // Run adaptive loop locally
    const stateWithNewTask = { ...state, tasks: [...state.tasks, task] };
    const adaptiveUpdates = calculateAdaptiveUpdates(stateWithNewTask, task.goalId, "New task added");
    
    const batch = writeBatch(db);
    batch.set(doc(db, `users/${uid}/goals/${task.goalId}/tasks`, task.id), task);
    
    const updatedGoal = adaptiveUpdates.goals?.find(g => g.id === task.goalId);
    if (updatedGoal) {
      batch.update(doc(db, `users/${uid}/goals`, task.goalId), {
        successProbability: updatedGoal.successProbability,
        riskLevel: updatedGoal.riskLevel,
        progress: updatedGoal.progress,
        aiActivityLog: updatedGoal.aiActivityLog,
      });
    }
    await batch.commit();
    if (adaptiveUpdates.notifications) set({ notifications: adaptiveUpdates.notifications });
  },
  
  updateTask: async (id, updates) => {
    const state = get();
    const uid = state.uid;
    if (!uid) return;
    
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    
    let adaptiveUpdates: Partial<FocusState> = {};
    if (updates.status !== undefined || updates.impactScore !== undefined) {
      let trigger = "Task updated";
      if (updates.status === 'done') trigger = "Task completed";
      else if (updates.status === 'todo' && task.status === 'done') trigger = "Task unchecked";
      else if (updates.status === 'in-progress') trigger = "Task started";
      
      const newTasks = state.tasks.map((t) => t.id === id ? { ...t, ...updates } as Task : t);
      const stateWithUpdatedTasks = { ...state, tasks: newTasks };
      adaptiveUpdates = calculateAdaptiveUpdates(stateWithUpdatedTasks, task.goalId, trigger);
    }
    
    const batch = writeBatch(db);
    batch.update(doc(db, `users/${uid}/goals/${task.goalId}/tasks`, id), updates);
    
    if (adaptiveUpdates.goals) {
      const updatedGoal = adaptiveUpdates.goals.find(g => g.id === task.goalId);
      if (updatedGoal) {
         batch.update(doc(db, `users/${uid}/goals`, task.goalId), {
           successProbability: updatedGoal.successProbability,
           riskLevel: updatedGoal.riskLevel,
           progress: updatedGoal.progress,
           aiActivityLog: updatedGoal.aiActivityLog,
           ...(updatedGoal.aiRecoveryPlan === undefined ? { aiRecoveryPlan: deleteField() } : {}),
           ...(updatedGoal.aiRiskExplanation === undefined ? { aiRiskExplanation: deleteField() } : {})
         });
      }
    }
    await batch.commit();
    if (adaptiveUpdates.notifications) set({ notifications: adaptiveUpdates.notifications });
  },
  
  removeTask: async (taskId) => {
    const state = get();
    const uid = state.uid;
    if (!uid) return;
    
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newTasks = state.tasks.filter(t => t.id !== taskId);
    const stateWithRemovedTask = { ...state, tasks: newTasks };
    const adaptiveUpdates = calculateAdaptiveUpdates(stateWithRemovedTask, task.goalId, "Task removed");
    
    const batch = writeBatch(db);
    batch.delete(doc(db, `users/${uid}/goals/${task.goalId}/tasks`, taskId));
    
    const updatedGoal = adaptiveUpdates.goals?.find(g => g.id === task.goalId);
    if (updatedGoal) {
      batch.update(doc(db, `users/${uid}/goals`, task.goalId), {
        successProbability: updatedGoal.successProbability,
        riskLevel: updatedGoal.riskLevel,
        progress: updatedGoal.progress,
        aiActivityLog: updatedGoal.aiActivityLog,
      });
    }
    await batch.commit();
    if (adaptiveUpdates.notifications) set({ notifications: adaptiveUpdates.notifications });
  },
  
  setSchedule: async (goalId, schedule) => {
    const uid = get().uid;
    if (!uid) return;
    await setDoc(doc(db, `users/${uid}/goals/${goalId}/schedule`, "main"), schedule);
  },
  
  setActiveMode: async (mode) => {
    const uid = get().uid;
    if (uid) {
      await updateDoc(doc(db, `users/${uid}/preferences/settings`), { activeMode: mode });
    } else {
      set({ activeMode: mode });
    }
  },
  
  setPreferredVoiceURI: async (uri) => {
    const uid = get().uid;
    if (uid) {
      await updateDoc(doc(db, `users/${uid}/preferences/settings`), { preferredVoiceURI: uri });
    } else {
      set({ preferredVoiceURI: uri });
    }
  },
  
  setWorkingWindow: async (window) => {
    const uid = get().uid;
    if (uid) {
      await updateDoc(doc(db, `users/${uid}/preferences/settings`), { workingWindow: window });
    } else {
      set({ workingWindow: window });
    }
  },

  setCalendarStatus: async (status) => {
    const uid = get().uid;
    if (uid) {
      await updateDoc(doc(db, `users/${uid}/preferences/settings`), { calendarStatus: status });
    } else {
      set({ calendarStatus: status });
    }
  },
  
  completeOnboarding: async () => {
    const uid = get().uid;
    if (uid) {
      await updateDoc(doc(db, `users/${uid}/profile/data`), { hasCompletedOnboarding: true });
    } else {
      set({ hasCompletedOnboarding: true });
    }
  },
  
  setDailyBriefing: (briefing) => set({ dailyBriefing: briefing }),
  
  addNotification: (message) => set((state) => ({
    notifications: [...state.notifications, { id: Date.now().toString() + Math.random().toString(), message }]
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  }))
}));
