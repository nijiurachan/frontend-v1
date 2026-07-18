export interface SubmissionLock {
  acquire: () => boolean;
  release: () => void;
  isLocked: () => boolean;
}

export function createSubmissionLock(): SubmissionLock {
  let isLocked = false;

  return {
    acquire: (): boolean => {
      if (isLocked) return false;
      isLocked = true;
      return true;
    },
    release: (): void => {
      isLocked = false;
    },
    isLocked: (): boolean => isLocked,
  };
}
