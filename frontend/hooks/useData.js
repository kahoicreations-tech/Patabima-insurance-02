import { useState, useEffect } from 'react';
import { quotationsAPI, policiesAPI, claimsAPI } from '../services/core/api';

/**
 * Hook for managing quotations data
 */
export const useQuotations = (status = null) => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchQuotations = async (pageNum = 1, resetData = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await quotationsAPI.getQuotations(pageNum, status);
      
      if (resetData || pageNum === 1) {
        setQuotations(response.data);
      } else {
        setQuotations(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.pagination.page < response.pagination.totalPages);
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  const createQuotation = async (data) => {
    try {
      const response = await quotationsAPI.createQuotation(data);
      setQuotations(prev => [response.data, ...prev]);
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateQuotation = async (id, data) => {
    try {
      const response = await quotationsAPI.updateQuotation(id, data);
      setQuotations(prev => 
        prev.map(item => item.id === id ? response.data : item)
      );
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteQuotation = async (id) => {
    try {
      await quotationsAPI.deleteQuotation(id);
      setQuotations(prev => prev.filter(item => item.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const sendQuotation = async (id) => {
    try {
      const response = await quotationsAPI.sendQuotation(id);
      setQuotations(prev => 
        prev.map(item => item.id === id ? { ...item, status: 'sent' } : item)
      );
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchQuotations(page + 1);
    }
  };

  const refresh = () => {
    fetchQuotations(1, true);
  };

  useEffect(() => {
    fetchQuotations();
  }, [status]);

  return {
    quotations,
    loading,
    error,
    hasMore,
    createQuotation,
    updateQuotation,
    deleteQuotation,
    sendQuotation,
    loadMore,
    refresh,
  };
};

/**
 * Hook for managing renewals data
 */
export const useRenewals = () => {
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRenewals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await policiesAPI.getRenewals();
      setRenewals(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching renewals:', err);
    } finally {
      setLoading(false);
    }
  };

  const renewPolicy = async (id, data) => {
    try {
      const response = await policiesAPI.renewPolicy(id, data);
      setRenewals(prev => 
        prev.map(item => item.id === id ? { ...item, status: 'renewed' } : item)
      );
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const refresh = () => {
    fetchRenewals();
  };

  useEffect(() => {
    fetchRenewals();
  }, []);

  return {
    renewals,
    loading,
    error,
    renewPolicy,
    refresh,
  };
};

/**
 * Hook for managing claims data
 */
export const useClaims = (status = null) => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchClaims = async (pageNum = 1, resetData = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await claimsAPI.getClaims(pageNum, status);
      
      if (resetData || pageNum === 1) {
        setClaims(response.data);
      } else {
        setClaims(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.pagination.page < response.pagination.totalPages);
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching claims:', err);
    } finally {
      setLoading(false);
    }
  };

  const createClaim = async (data) => {
    try {
      const response = await claimsAPI.createClaim(data);
      setClaims(prev => [response.data, ...prev]);
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateClaim = async (id, data) => {
    try {
      const response = await claimsAPI.updateClaim(id, data);
      setClaims(prev => 
        prev.map(item => item.id === id ? response.data : item)
      );
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchClaims(page + 1);
    }
  };

  const refresh = () => {
    fetchClaims(1, true);
  };

  useEffect(() => {
    fetchClaims();
  }, [status]);

  return {
    claims,
    loading,
    error,
    hasMore,
    createClaim,
    updateClaim,
    loadMore,
    refresh,
  };
};
