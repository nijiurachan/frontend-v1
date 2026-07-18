export type SubmissionUiState = {
  isPreparingSubmit: boolean;
  showSuccess: boolean;
  submitError: string | null;
};

export type SubmissionUiAction =
  | { type: "failure"; message: string }
  | { type: "finish" }
  | { type: "hide-success" }
  | { type: "reset" }
  | { type: "start" }
  | { type: "success" };

export function createSubmissionUiState(): SubmissionUiState {
  return {
    isPreparingSubmit: false,
    showSuccess: false,
    submitError: null,
  };
}

export function submissionUiReducer(
  state: SubmissionUiState,
  action: SubmissionUiAction,
): SubmissionUiState {
  switch (action.type) {
    case "failure":
      return { ...state, submitError: action.message };
    case "finish":
      return { ...state, isPreparingSubmit: false };
    case "hide-success":
      return { ...state, showSuccess: false };
    case "reset":
      return createSubmissionUiState();
    case "start":
      return {
        isPreparingSubmit: true,
        showSuccess: false,
        submitError: null,
      };
    case "success":
      return { ...state, showSuccess: true, submitError: null };
  }
}

export function isSubmissionInProgress(
  state: SubmissionUiState,
  mutationPending: boolean,
): boolean {
  return state.isPreparingSubmit || mutationPending;
}
