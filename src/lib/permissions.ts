/** Tenant permission matrix from plan §7.10. The API remains the authority. */

export const ROLES = ["Owner", "Manager", "Staff", "Collector", "Viewer"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "dashboard.view",
  "dashboard.full",
  "reports.view",
  "reports.own",
  "settings.manage",
  "wallet.view",
  "wallet.manage",
  "staff.manage",
  "staff.assignOwner",
  "customers.write",
  "customers.editLimited",
  "customers.delete",
  "ledger.creditSale",
  "ledger.payment",
  "ledger.paymentMade",
  "ledger.adjustment",
  "ledger.reverse",
  "ledger.reverseOwn",
  "collections.approve",
  "messages.send",
  "messages.bulk",
  "reminders.manage",
  "data.export",
  "audit.view",
  "period.lock",
  "subscription.view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const MATRIX: Record<Permission, readonly Role[]> = {
  "dashboard.view": ["Owner", "Manager", "Staff", "Collector", "Viewer"],
  "dashboard.full": ["Owner", "Manager", "Staff", "Viewer"],
  "reports.view": ["Owner", "Manager", "Staff", "Viewer"],
  "reports.own": ["Collector"],
  "settings.manage": ["Owner"],
  "wallet.view": ["Owner", "Manager"],
  "wallet.manage": ["Owner"],
  "staff.manage": ["Owner", "Manager"],
  "staff.assignOwner": ["Owner"],
  "customers.write": ["Owner", "Manager", "Staff"],
  "customers.editLimited": ["Collector"],
  "customers.delete": ["Owner", "Manager"],
  "ledger.creditSale": ["Owner", "Manager", "Staff"],
  "ledger.payment": ["Owner", "Manager", "Staff", "Collector"],
  "ledger.paymentMade": ["Owner", "Manager", "Staff"],
  "ledger.adjustment": ["Owner", "Manager"],
  "ledger.reverse": ["Owner", "Manager"],
  "ledger.reverseOwn": ["Staff"],
  "collections.approve": ["Owner", "Manager"],
  "messages.send": ["Owner", "Manager", "Staff", "Collector"],
  "messages.bulk": ["Owner", "Manager"],
  "reminders.manage": ["Owner", "Manager"],
  "data.export": ["Owner", "Manager"],
  "audit.view": ["Owner", "Manager"],
  "period.lock": ["Owner"],
  "subscription.view": ["Owner"],
};

export function permissionsFor(role: Role): Permission[] {
  return PERMISSIONS.filter((permission) => MATRIX[permission].includes(role));
}

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return MATRIX[permission].includes(role);
}

export function assertCan(role: Role, permission: Permission): void {
  if (!can(role, permission)) {
    const error = new Error("FORBIDDEN");
    error.name = "ForbiddenError";
    throw error;
  }
}
