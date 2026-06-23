import crypto from 'node:crypto';
import { AppError, createValidationError } from '../utils/error.js';

const jobs = new Map();

function buildReport(companyName) {
  return {
    companyName,
    status: 'completed',
    summary: 'Backend scaffold is ready. Research agents are not wired yet.',
    scorecard: {
      financialHealth: null,
      newsMomentum: null,
      competition: null,
      riskPenalty: null,
      totalScore: null,
    },
    recommendation: 'PASS',
    evidence: [],
  };
}

export function createResearchJob(input) {
  const companyName = typeof input?.companyName === 'string' ? input.companyName.trim() : '';

  if (!companyName) {
    throw createValidationError('companyName is required');
  }

  const jobId = crypto.randomUUID();
  const job = {
    jobId,
    companyName,
    status: 'queued',
    progress: 0,
    currentStep: 'queued',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    report: buildReport(companyName),
  };

  jobs.set(jobId, job);
  return job;
}

export function getResearchJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) {
    throw new AppError('Job not found', 404);
  }

  return job;
}

export function getResearchReport(jobId) {
  return getResearchJob(jobId).report;
}

export function runResearchJob(jobId) {
  const job = getResearchJob(jobId);
  const next = {
    ...job,
    status: 'completed',
    progress: 100,
    currentStep: 'completed',
    updatedAt: new Date().toISOString(),
    report: buildReport(job.companyName),
  };

  jobs.set(jobId, next);
  return next;
}

export function rerunResearchJob(jobId, overrides = {}) {
  const job = getResearchJob(jobId);
  const rerun = createResearchJob({ companyName: job.companyName, ...overrides });
  return rerun;
}
