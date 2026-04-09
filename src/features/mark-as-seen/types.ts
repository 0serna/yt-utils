export type AutomationResult = {
  ok: true;
  redirectUrl: string;
} | {
  ok: false;
  code: string;
  message: string;
  details: unknown;
};

export type AutomationErrorCode =
  | "UNSUPPORTED_PAGE"
  | "VIDEO_NOT_FOUND"
  | "VIDEO_NOT_READY"
  | "SEEK_FAILED"
  | "PAUSE_FAILED"
  | "SHARE_BUTTON_NOT_FOUND"
  | "SHARE_DIALOG_NOT_FOUND"
  | "START_AT_NOT_FOUND"
  | "SHARE_URL_NOT_FOUND"
  | "SHARE_URL_NOT_READY"
  | "COPY_BUTTON_NOT_FOUND"
  | "AUTOMATION_FAILED";

export type HandlerErrorCode =
  | "TAB_NOT_FOUND"
  | "UNSUPPORTED_PAGE"
  | "AUTOMATION_FAILED";