import { useEffect, useState } from 'react';
import PatientEnquiry from './screens/PatientEnquiry';
import Dashboard from './screens/Dashboard';

export type Route = 'patient' | 'dashboard';

const readRoute = (): Route => (window.location.hash.startsWith('#/dashboard') ? 'dashboard' : 'patient');

export default function App() {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const onHash = () => {
      setRoute(readRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <>
      <nav className="proto-bar" aria-label="Prototype screens">
        <span className="proto-bar__label">
          <span className="proto-dot" aria-hidden /> Prototype · fictional data
        </span>
        <div className="proto-bar__tabs" role="tablist">
          <a href="#/patient" role="tab" aria-selected={route === 'patient'} className={route === 'patient' ? 'active' : ''}>
            <span className="step">1</span> Patient enquiry
          </a>
          <a href="#/dashboard" role="tab" aria-selected={route === 'dashboard'} className={route === 'dashboard' ? 'active' : ''}>
            <span className="step">2</span> Front-desk dashboard
          </a>
        </div>
      </nav>
      {route === 'dashboard' ? <Dashboard /> : <PatientEnquiry />}
    </>
  );
}
