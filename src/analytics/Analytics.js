// Analytics.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FaLink, FaExternalLinkAlt, FaChartBar, FaGlobe, FaMobileAlt, FaDesktop, FaQuestion } from 'react-icons/fa';
import './Analytics.css';

const URLList = ({ urls, onSelectURL }) => {
  return (
    <div className="url-list">
      <h2>Your Shortened URLs</h2>
      {urls.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any shortened URLs yet.</p>
        </div>
      ) : (
        <div className="url-cards">
          {urls.map((url) => (
            <div className="url-card" key={url.short_code} onClick={() => onSelectURL(url)}>
              <div className="url-card-icon">
                <FaLink />
              </div>
              <div className="url-card-details">
                <h3>{url.short_code}</h3>
                <p className="long-url">{url.long_url}</p>
                <div className="url-card-meta">
                  <span className="url-card-clicks">
                    <FaChartBar /> {url.total_clicks} clicks
                  </span>
                  <span className="url-card-date">
                    Created: {new Date(url.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const URLAnalytics = ({ url }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!url || !url.short_code) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`https://linq.red/urls/analytics?short_code=${url.short_code}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Error fetching analytics: ${response.status}`);
        }

        const data = await response.json();
        setAnalytics(data.analytics);
      } catch (err) {
        setError(`Failed to load analytics: ${err.message}`);
        console.error('Analytics error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [url, token]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="url-analytics loading">
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="url-analytics error">
        <p>{error}</p>
      </div>
    );
  }

  // If analytics data is missing, show a placeholder
  if (!analytics) {
    return (
      <div className="url-analytics">
        <div className="analytics-header">
          <h2>Analytics for {url.short_code}</h2>
          <div className="analytics-actions">
            <a href={url.short_url} target="_blank" rel="noopener noreferrer" className="analytics-action-button">
              <FaExternalLinkAlt /> Open
            </a>
          </div>
        </div>
        <div className="analytics-card">
          <h3>No analytics data available</h3>
          <p>Analytics data will appear here after your link receives clicks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="url-analytics">
      <div className="analytics-header">
        <h2>Analytics for {url.short_code}</h2>
        <div className="analytics-actions">
          <a href={url.short_url} target="_blank" rel="noopener noreferrer" className="analytics-action-button">
            <FaExternalLinkAlt /> Open
          </a>
        </div>
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon"><FaChartBar /></div>
          <div className="stat-value">{url.total_clicks}</div>
          <div className="stat-label">Total Clicks</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaGlobe /></div>
          <div className="stat-value">{analytics.countries.length}</div>
          <div className="stat-label">Countries</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaLink /></div>
          <div className="stat-value">{analytics.referrers.length}</div>
          <div className="stat-label">Referrers</div>
        </div>
      </div>

      <div className="analytics-row">
        <div className="analytics-card">
          <h3>Clicks Over Time</h3>
          {analytics.daily_clicks.length === 0 ? (
            <p>No click data available</p>
          ) : (
            <div className="chart-container">
              <div className="bar-chart">
                {analytics.daily_clicks.map((day) => (
                  <div className="bar-item" key={day.date}>
                    <div 
                      className="bar" 
                      style={{ 
                        height: `${Math.max(10, (day.count / Math.max(...analytics.daily_clicks.map(d => d.count))) * 100)}%` 
                      }}
                    >
                      <span className="count">{day.count}</span>
                    </div>
                    <div className="bar-label">{formatDate(day.date)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="analytics-card">
          <h3>Traffic Sources</h3>
          {analytics.referrers.length === 0 ? (
            <p>No referrer data available</p>
          ) : (
            <div className="table-container">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Clicks</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.referrers.map((referrer) => (
                    <tr key={referrer.source}>
                      <td>{referrer.source === 'Direct' ? 'Direct / Bookmark' : referrer.source}</td>
                      <td>{referrer.count}</td>
                      <td>
                        {Math.round((referrer.count / analytics.total_clicks_analyzed) * 100)}%
                        <div className="percentage-bar" style={{ width: `${(referrer.count / analytics.total_clicks_analyzed) * 100}%` }}></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="analytics-row">
        <div className="analytics-card">
          <h3>Device Types</h3>
          {analytics.devices.length === 0 ? (
            <p>No device data available</p>
          ) : (
            <div className="device-stats">
              {analytics.devices.map((device) => (
                <div className="device-stat" key={device.type}>
                  <div className="device-icon">
                    {device.type === 'mobile' ? (
                      <FaMobileAlt />
                    ) : device.type === 'desktop' ? (
                      <FaDesktop />
                    ) : (
                      <FaQuestion />
                    )}
                  </div>
                  <div className="device-info">
                    <div className="device-type">{device.type.charAt(0).toUpperCase() + device.type.slice(1)}</div>
                    <div className="device-count">{device.count} clicks</div>
                    <div className="device-percentage">
                      {Math.round((device.count / analytics.total_clicks_analyzed) * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="analytics-card">
          <h3>Geographic Distribution</h3>
          {analytics.countries.length === 0 ? (
            <p>No geographic data available</p>
          ) : (
            <div className="table-container">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Country</th>
                    <th>Clicks</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.countries.map((country) => (
                    <tr key={country.country}>
                      <td>{country.country}</td>
                      <td>{country.count}</td>
                      <td>
                        {Math.round((country.count / analytics.total_clicks_analyzed) * 100)}%
                        <div className="percentage-bar" style={{ width: `${(country.count / analytics.total_clicks_analyzed) * 100}%` }}></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="analytics-card api-example">
        <h3>API Access</h3>
        <p>Access your analytics programmatically via our API:</p>
        <SyntaxHighlighter language="javascript" style={dracula}>
{`// Get detailed analytics for this URL
fetch('https://linq.red/urls/analytics?short_code=${url.short_code}', {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_AUTH_TOKEN'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const Analytics = () => {
  const [urls, setUrls] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchUrls = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('https://linq.red/urls', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Error fetching URLs: ${response.status}`);
        }

        const data = await response.json();
        setUrls(data.urls || []);
        
        // Automatically select the first URL if available
        if (data.urls && data.urls.length > 0) {
          setSelectedUrl(data.urls[0]);
        }
      } catch (err) {
        setError(`Failed to load URLs: ${err.message}`);
        console.error('Error fetching URLs:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUrls();
    }
  }, [token]);

  const handleSelectUrl = (url) => {
    setSelectedUrl(url);
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-message">Loading your analytics data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header-main">
        <h1>URL Analytics</h1>
        <p>Track and analyze the performance of your shortened URLs.</p>
      </div>
      
      <div className="analytics-layout">
        <div className="analytics-sidebar">
          <URLList urls={urls} onSelectURL={handleSelectUrl} />
        </div>
        
        <div className="analytics-content">
          {selectedUrl ? (
            <URLAnalytics url={selectedUrl} />
          ) : (
            <div className="analytics-empty-state">
              <div className="empty-icon"><FaChartBar /></div>
              <h2>No URL Selected</h2>
              <p>Select a URL from the list to view detailed analytics.</p>
              {urls.length === 0 && (
                <p>Create a shortened URL first to start tracking analytics.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;