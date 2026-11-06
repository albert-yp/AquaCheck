import {
  ACTIVITY_TYPE, CHECKLIST_FIELDS, REVIEW_CHECKS, TANK_CONDITION,
} from '../constants/statuses.js';
import { getTodayDate } from '../utils/dateFormat.js';

export const REPORT_FIELDS = [
  'executionDate', 'startTime', 'endTime', 'checklist', 'waterObservations',
  'findings', 'actions', 'workDetails', 'finalCondition', 'remainingIssues',
  'recommendation', 'photoRefs',
];

export function createReportDraft(assignmentId, previousReport = null) {
  const draft = {
    id: `draft-${assignmentId}`,
    assignmentId,
    basedOnReportId: previousReport?.id ?? null,
    executionDate: getTodayDate(),
    startTime: '',
    endTime: '',
    checklist: Object.fromEntries(CHECKLIST_FIELDS.map(({ key }) => [key, { result: '', notes: '' }])),
    waterObservations: { color: '', clarity: '', odor: '', notes: '' },
    findings: [],
    actions: [ACTIVITY_TYPE.INSPECTION],
    workDetails: '',
    finalCondition: TANK_CONDITION.UNASSESSED,
    remainingIssues: '',
    recommendation: '',
    photoRefs: [],
    updatedAt: null,
  };
  if (previousReport) {
    for (const field of REPORT_FIELDS) {
      if (previousReport[field] !== undefined) draft[field] = structuredClone(previousReport[field]);
    }
  }
  return draft;
}

export function createReviewForm(reportId) {
  return {
    reportId,
    reviewDate: getTodayDate(),
    checks: Object.fromEntries(REVIEW_CHECKS.map(({ key }) => [key, false])),
    finalCondition: TANK_CONDITION.UNASSESSED,
    remainingIssues: '',
    decision: '',
    notes: '',
  };
}
