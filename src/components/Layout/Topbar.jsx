import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getTodayNewBookingsCount, getAllMembers } from '../../services/firestoreService';
import './Topbar.css';

export default function Topbar({ view, onMenuToggle }) {
  const { currentUser, userRole, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const dropdownRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allMembersCache, setAllMembersCache] = useState(null);
  const searchRef = useRef(null);

  const displayName = userData?.name || currentUser?.email || (view === 'admin' ? 'Admin' : 'Membro');
  const firstLetter = displayName.charAt(0).toUpperCase();
  const planLabel = userData?.plan || null;

  // Load notification count (today's bookings for admin)
  useEffect(() => {
    if (userRole !== 'admin') return;
    getTodayNewBookingsCount()
      .then(setNotifCount)
      .catch(() => setNotifCount(0));
  }, [userRole]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  }

  const handleSearchChange = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);

    if (q.trim().length > 1) {
      if (userRole === 'admin') {
        if (!allMembersCache) {
          setIsSearching(true);
          try {
            const members = await getAllMembers();
            setAllMembersCache(members);
            filterResults(q, members);
          } catch (error) {
            console.error('Error fetching members for search:', error);
          } finally {
            setIsSearching(false);
          }
        } else {
          filterResults(q, allMembersCache);
        }
      }
    } else {
      setSearchResults([]);
    }
  };

  const filterResults = (query, membersData) => {
    const qLower = query.toLowerCase();
    const filtered = membersData.filter(m => 
      (m.name || '').toLowerCase().includes(qLower) || 
      (m.email || '').toLowerCase().includes(qLower)
    ).slice(0, 5);
    setSearchResults(filtered);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Hamburger — only visible on mobile */}
        <button
          className="hamburger-btn"
          onClick={onMenuToggle}
          aria-label="Apri menu"
        >
          <span /><span /><span />
        </button>

        <div className="topbar-search" ref={searchRef}>
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder={userRole === 'admin' ? "Cerca membri, email..." : "Cerca..."}
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery.length > 1 && (
            <div className="search-dropdown-results">
              {isSearching ? (
                <div className="search-loading">Ricerca in corso...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map(member => (
                  <div 
                    key={member.id} 
                    className="search-result-item"
                    onClick={() => {
                        navigate(`/admin/members/${member.id}`);
                        setSearchQuery('');
                    }}
                  >
                    <div className="avatar-sm">{member.name ? member.name.charAt(0).toUpperCase() : '?'}</div>
                    <div className="search-result-info">
                      <span className="search-result-name">{member.name || 'Senza nome'}</span>
                      <span className="search-result-sub">{member.email}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="search-empty">Nessun risultato trovato</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="topbar-actions">
        {/* Notification bell */}
        <div className="notification-bell" title={`${notifCount} prenotazioni oggi`}>
          {notifCount > 0 && <span className="badge">{notifCount > 9 ? '9+' : notifCount}</span>}
          🔔
        </div>

        {/* Profile dropdown */}
        <div className="user-profile" ref={dropdownRef} onClick={() => setProfileOpen(!profileOpen)}>
          <div className="avatar">{firstLetter}</div>
          <div className="user-info hide-mobile">
            <span className="user-name">{displayName}</span>
            <span className="user-role">
              {userRole === 'admin' ? 'Amministratore' : planLabel ? `Piano ${planLabel}` : 'Membro'}
            </span>
          </div>
          <span className="dropdown-arrow hide-mobile">{profileOpen ? '▲' : '▼'}</span>

          {profileOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-avatar">{firstLetter}</div>
                <div>
                  <p className="dropdown-name">{displayName}</p>
                  <p className="dropdown-email">{currentUser?.email}</p>
                </div>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleLogout}>
                🚪 Esci dall'account
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
