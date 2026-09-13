/**
 * LawPilot Open-Access User Context
 * 
 * ARCHITECTURAL PRINCIPLE:
 * LawPilot is engineered for frictionless, local-first access.
 * It requires NO user accounts, NO logins, NO registration screens, and NO auth guards.
 * Users can immediately explore all capabilities without gating.
 */

export interface LawPilotUser {
  uid: string;
  email?: string;
  displayName?: string;
  isAnonymous: boolean;
}

export const DEMO_USER: LawPilotUser = {
  uid: "lawpilot-public-user",
  email: "guest@lawpilot.local",
  displayName: "Guest User (Open Access)",
  isAnonymous: true,
};

/**
 * Returns the active frictionless user context.
 * Never throws, never redirects, never gates application access.
 */
export function getCurrentUser(): LawPilotUser {
  return DEMO_USER;
}
