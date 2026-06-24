import { useState } from 'react';
import { analyzeCompany } from '../services/api.js';

export function useCompanyAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(company) {
    const value = typeof company === 'string' ? company.trim() : '';

    if (!value) {
      setError('Enter a company name to continue.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await analyzeCompany(value);
      setData(result);
      return result;
    } catch (submissionError) {
      setError(submissionError.message || 'Something went wrong while analyzing the company.');
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setData(null);
    setError('');
    setLoading(false);
  }

  return {
    data,
    loading,
    error,
    submit,
    reset,
  };
}
