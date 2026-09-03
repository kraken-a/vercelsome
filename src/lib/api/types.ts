export type { Result, PaginatedMeta } from './client';

import type { Result } from './client';

export function isSuccess<T>(
  result: Result<T>
): result is Extract<Result<T>, { success: true }> {
  return result.success === true;
}

export function isError<T>(
  result: Result<T>
): result is Extract<Result<T>, { success: false }> {
  return result.success === false;
}
