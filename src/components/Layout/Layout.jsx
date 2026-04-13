import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './Layout.css';

export default function Layout({ children, view, setView }) {
  return (
    <div className="layout-container">
      <Sidebar view={view} setView={setView} />
      <div className="main-wrapper">
        <Topbar view={view} />
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
}
