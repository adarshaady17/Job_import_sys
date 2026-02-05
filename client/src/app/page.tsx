'use client';

import React, { useEffect, useState } from 'react';
import { importHistoryApi, ImportLog, StatsResponse } from '@/lib/api';
import './globals.css';

export default function Home() {
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [stats, setStats] = useState<StatsResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    source: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [triggering, setTriggering] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const limit = 20;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [historyRes, statsRes] = await Promise.all([
        importHistoryApi.getHistory(page, limit, filters),
        importHistoryApi.getStats(),
      ]);
      if (historyRes.success) {
        setImportLogs(historyRes.data);
        setTotalPages(historyRes.pagination.pages);
      }
      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const handleTriggerFetch = async () => {
    setTriggering(true);
    setMessage(null);
    try {
      const res = await importHistoryApi.triggerFetch();
      if (res.success) {
        setMessage({ type: 'success', text: 'Job fetch triggered successfully' });
        setTimeout(fetchData, 2000);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to trigger fetch' });
    } finally {
      setTriggering(false);
    }
  };

  const formatDate = (s: string) => new Date(s).toLocaleString();

  const formatUrl = (url: string) => (url.length > 60 ? `${url.slice(0, 60)}...` : url);

  return (
    <div className="container">
      <div className="header">
        <h1>Job Import System - Import History</h1>
      </div>

      {message && <div className={message.type === 'success' ? 'success' : 'error'}>{message.text}</div>}
      {error && <div className="error">{error}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Imports</h3>
            <div className="value">{stats.totalImports.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <h3>Total Fetched</h3>
            <div className="value">{stats.totalFetched.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <h3>Total Imported</h3>
            <div className="value">{stats.totalImported.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <h3>New Jobs</h3>
            <div className="value">{stats.totalNew.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <h3>Updated Jobs</h3>
            <div className="value">{stats.totalUpdated.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <h3>Failed Jobs</h3>
            <div className="value">{stats.totalFailed.toLocaleString()}</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="filters">
          <div className="filter-group">
            <label>Source</label>
            <input
              type="text"
              placeholder="Filter by source"
              value={filters.source}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFilters({ ...filters, source: e.target.value });
                setPage(1);
              }}
            />
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setFilters({ ...filters, status: e.target.value });
                setPage(1);
              }}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFilters({ ...filters, startDate: e.target.value });
                setPage(1);
              }}
            />
          </div>
          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFilters({ ...filters, endDate: e.target.value });
                setPage(1);
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleTriggerFetch} disabled={triggering}>
              {triggering ? 'Triggering...' : 'Trigger Fetch'}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>File Name (URL)</th>
                  <th>Timestamp</th>
                  <th>Total</th>
                  <th>New</th>
                  <th>Updated</th>
                  <th>Failed</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {importLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                      No import history found
                    </td>
                  </tr>
                ) : (
                  importLogs.map((log) => (
                    <tr key={log._id}>
                      <td className="url-cell">
                        <a href={log.fileName} target="_blank" rel="noopener noreferrer">
                          {formatUrl(log.fileName)}
                        </a>
                      </td>
                      <td>{formatDate(log.timestamp)}</td>
                      <td>{log.totalImported}</td>
                      <td>{log.newJobs}</td>
                      <td>{log.updatedJobs}</td>
                      <td>{log.failedJobs}</td>
                      <td>
                        <span className={`status-badge status-${log.status}`}>{log.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  Previous
                </button>
                <span className="page-info">
                  Page {page} of {totalPages}
                </span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


