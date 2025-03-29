 import React from 'react';
import { Link } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import '../styles/styles.css';

const DashboardCard = ({ icon, title, description, link }) => (
  <div className={`overview-card ${title.toLowerCase().replace(/\s+/g, '-')}`}>
    <div className="card-icon">{icon}</div>
    <div className="card-content">
      <h3>{title}</h3>
      <p>{description}</p>
      <Link to={link} className="card-button">
        {title.includes('Management') ? 'Manage' : 'View'} {title.split(' ')[0]}
      </Link>
    </div>
  </div>
);

const AdminDashboard = () => {
  const cards = [
    {
      icon: '👤',
      title: 'User Management',
      description: 'Manage staff accounts and permissions',
      link: '/admin/users'
    },
    {
      icon: '📦',
      title: 'Inventory Control',
      description: 'Track medical supplies and equipment',
      link: '/admin/inventory'
    },
    {
      icon: '📊',
      title: 'Reports Dashboard',
      description: 'View clinic analytics and insights',
      link: '/admin/reports'
    }
  ];

  return (
    <div className="admin-dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Clinicare Admin</h2>
        </div>
        <nav className="nav-menu">
          {cards.map(card => (
            <Link key={card.title} to={card.link} className="nav-link">
              <span className="nav-icon">{card.icon}</span>
              <span className="nav-text">{card.title}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <LogoutButton />
        </div>
      </aside>

      <main className="admin-content">
        <header className="content-header">
          <h1>Administrative Dashboard</h1>
          <p>Manage all clinic operations from this centralized view</p>
        </header>

        <div className="dashboard-grid">
          {cards.map(card => (
            <DashboardCard key={card.title} {...card} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;