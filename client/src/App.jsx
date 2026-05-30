import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Calendar from './pages/Calendar';
import Invoices from './pages/Invoices';
import Stats from './pages/Stats';

export default function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </main>
    </div>
  );
}
