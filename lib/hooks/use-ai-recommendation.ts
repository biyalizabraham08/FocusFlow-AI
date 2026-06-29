import { useMemo } from 'react';
import { useStore, Task, Goal } from '@/lib/store';

export interface AiRecommendation {
  task: Task | null;
  impactText: string;
  reason: string;
}

export function useAiRecommendation(specificGoalId?: string): AiRecommendation {
  const { tasks, goals } = useStore();

  return useMemo(() => {
    // 1. Filter out completed tasks
    let pendingTasks = tasks.filter((t) => t.status !== 'done');
    
    // 2. Filter by specific goal if requested
    if (specificGoalId) {
      pendingTasks = pendingTasks.filter((t) => t.goalId === specificGoalId);
    }

    if (pendingTasks.length === 0) {
      return {
        task: null,
        impactText: 'N/A',
        reason: 'You have completed all your tasks! Enjoy your break, or create a new goal.',
      };
    }

    // 3. Sort remaining tasks by impactScore (descending)
    const sortedTasks = [...pendingTasks].sort((a, b) => {
      // Prioritize by impact score first
      if (b.impactScore !== a.impactScore) {
        return b.impactScore - a.impactScore;
      }
      // If impact is same, prioritize by priority level
      const priorityWeight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });

    const topTask = sortedTasks[0];
    const goal = goals.find((g) => g.id === topTask.goalId);

    // 4. Generate dynamic impact text
    const impactPercent = Math.max(1, Math.round(topTask.impactScore / 5));
    const impactText = `+${impactPercent}% Success Probability`;

    // 5. Generate AI Reason
    let reason = `Completing "${topTask.title}" is your most impactful next step. `;
    
    if (topTask.priority === 'Critical') {
      reason += `It's a critical bottleneck blocking further progress. `;
    } else if (topTask.priority === 'High') {
      reason += `This high-priority task provides significant value immediately. `;
    }

    if (goal && (goal.riskLevel === 'High' || goal.riskLevel === 'Critical')) {
      reason += `Your goal "${goal.title}" is currently at risk, and this action is the fastest way to get back on track. `;
    }

    if (topTask.durationMinutes >= 120) {
      reason += `This requires deep work, block out ${Math.round(topTask.durationMinutes / 60)} hours to focus completely.`;
    } else if (topTask.durationMinutes <= 30) {
      reason += `It's a quick win. Knock it out now to build momentum.`;
    } else {
      reason += `Allocate ${topTask.durationMinutes} minutes to complete this without distractions.`;
    }

    return {
      task: topTask,
      impactText,
      reason,
    };
  }, [tasks, goals, specificGoalId]);
}
