// Shared Prisma `select` for any Employee query whose result gets serialized
// to a client component — never include passwordHash in that payload, since
// server-component props are shipped to the browser in the RSC stream.
export const PUBLIC_EMPLOYEE_SELECT = {
  id: true,
  name: true,
  isCEO: true,
  isManager: true,
  isOpsAdmin: true,
  isOnline: true,
  isField: true,
  isAM: true,
  isAMLead: true,
  phone: true,
  email: true,
  active: true,
} as const;
