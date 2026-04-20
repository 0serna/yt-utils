export type AutomationResult =
	| { ok: true }
	| {
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
	| "AUTOMATION_FAILED";

export type HandlerErrorCode =
	| "TAB_NOT_FOUND"
	| "UNSUPPORTED_PAGE"
	| "AUTOMATION_FAILED";
