/**
 * LawPilot Authentication & User Context
 * 
 * ARCHITECTURE PRINCIPLE (PHASE 6):
 * LawPilot is a competition-grade prototype engineered for frictionless access.
 * It requires NO user accounts, NO logins, NO registration screens, and NO auth guards.
 * Judges, evaluators, and users can immediately test all capabilities without gating.
 */

export interface LawPilotUser {
  uid: string;
  email?: string;
  displayName?: string;
  isAnonymous: boolean;
}

export const DEMO_USER: LawPilotUser = {
  uid: "lawpilot-public-user",
  email: "evaluator@lawpilot.local",
  displayName: "Legal Evaluator (Open Access)",
  isAnonymous: true,
};

/**
 * Returns the active frictionless user context.
 * Never throws, never redirects, never gates application access.
 */
export function getCurrentUser(): LawPilotUser {
  return DEMO_USER;
}

