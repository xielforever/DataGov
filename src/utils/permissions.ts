export const PLATFORM_ALL_PERMISSION = 'platform:*';

export function hasPermission(userPermissions: string[] | undefined, required?: string | string[]) {
  if (!required || (Array.isArray(required) && required.length === 0)) {
    return true;
  }

  const requiredPermissions = Array.isArray(required) ? required : [required];
  const permissions = userPermissions ?? [];

  return requiredPermissions.some((permission) =>
    permissions.some((granted) => permissionMatches(granted, permission)),
  );
}

function permissionMatches(granted: string, required: string) {
  if (!granted) return false;
  if (granted === required || granted === PLATFORM_ALL_PERMISSION) return true;
  if (granted.endsWith(':*')) {
    return required.startsWith(granted.slice(0, -1));
  }
  return false;
}
