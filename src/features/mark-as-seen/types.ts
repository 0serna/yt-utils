export type AutomationResult =
  | { ok: true }
  | {
      ok: false;
      code: string;
      message: string;
      details: unknown;
    };
