import React from 'react';

interface DashboardShellProps {
  rol: string;
  titulo: string;
  showMisCausas?: boolean;
  children: React.ReactNode;
}

const DashboardShell: React.FC<DashboardShellProps> = ({ rol, titulo, showMisCausas, children }) => {
  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <h1>{titulo}</h1>
        {showMisCausas && <button className="button-secondary">Mis Causas</button>}
      </header>
      <main className="dashboard-content">
        {children}
      </main>
      <footer className="dashboard-footer">
        <p>Rol: {rol}</p>
      </footer>
    </div>
  );
};

export default DashboardShell;