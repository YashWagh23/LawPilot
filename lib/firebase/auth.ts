/**
 * Firebase Auth Helpers & Current User Context
 */

export interface LawPilotUser {
  uid: string;
  email?: string;
  displayName?: string;
  isAnonymous: boolean;
}

export const DEMO_USER: LawPilotUser = {
  uid: "demo-user-1001",
  email: "counsel.preview@lawpilot.local",
  displayName: "Legal Reviewer (Demo Mode)",
  isAnonymous: true,
};

export function getCurrentUser(): LawPilotUser {
  return DEMO_USER;
}
