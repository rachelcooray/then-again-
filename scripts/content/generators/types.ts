/** 1 easy, 2 medium, 3 hard. The planner ramps these through the week. */
export type Level = 1 | 2 | 3;

/** A generated puzzle before it goes through the safety and quality gate. */
export interface Draft<P = unknown> {
  formatId: string;
  level: Level;
  payload: P;
  /** What players solve for; used to stop the same answer coming back too soon. */
  answers: string[];
  /** Result-card text, if the generator has any. */
  memory?: { title?: string; text: string };
  /** Text written by a person or model (not just dictionary words) must be reviewed before publishing. */
  needsReview?: string;
}
