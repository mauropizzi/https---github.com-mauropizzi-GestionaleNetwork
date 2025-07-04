import React, { ComponentType } from 'react';
import { Link, LinkProps } from 'react-router-dom';

// A simple in-memory cache for prefetched routes
const prefetchCache = new Set<string>();

// Mapping of route paths to their dynamic import function
// This must be kept in sync with the routes in App.tsx
const routePrefetchMap: { [key: string]: () => Promise<any> } = {
  '/': () => import('@/pages/CentraleOperativa'),
  '/service-request': () => import('@/pages/ServiceRequest'),
  '/anagrafiche': () => import('@/pages/Anagrafiche'),
  '/anagrafiche/clienti': () => import('@/pages/ClientiPage'),
  '/anagrafiche/punti-servizio': () => import('@/pages/PuntiServizioPage'),
  '/anagrafiche/personale': () => import('@/pages/PersonalePage'),
  '/anagrafiche/operatori-network': () => import('@/pages/OperatoriNetworkPage'),
  '/anagrafiche/fornitori': () => import('@/pages/FornitoriPage'),
  '/anagrafiche/tariffe': () => import('@/pages/TariffePage'),
  '/anagrafiche/procedure': () => import('@/pages/ProcedurePage'),
  '/anagrafiche/clienti/:clientId/contacts': () => import('@/pages/ClientContactsPage'), // New route
  '/dotazioni-di-servizio': () => import('@/pages/DotazioniDiServizio'),
  '/service-list': () => import('@/pages/ServiceList'),
  '/registro-di-cantiere': () => import('@/pages/RegistroDiCantiere'),
  '/servizi-a-canone': () => import('@/pages/ServiziCanone'),
  '/incoming-emails': () => import('@/pages/IncomingEmails'),
  '/analisi-contabile': () => import('@/pages/AnalisiContabile'),
  '/richiesta-manutenzione': () => import('@/pages/RichiestaManutenzione'),
  '/access-management': () => import('@/pages/AccessManagementPage'),
};

export const PrefetchLink: React.FC<LinkProps> = ({ to, onMouseOver, ...props }) => {
  const handleMouseOver = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const path = typeof to === 'string' ? to.split('?')[0] : to.pathname;

    // Handle dynamic segments for prefetching
    let prefetchPath = path;
    if (path.startsWith('/anagrafiche/clienti/') && path.includes('/contacts')) {
      prefetchPath = '/anagrafiche/clienti/:clientId/contacts';
    }

    if (prefetchPath && routePrefetchMap[prefetchPath] && !prefetchCache.has(prefetchPath)) {
      console.log(`Prefetching route: ${prefetchPath}`);
      routePrefetchMap[prefetchPath]();
      prefetchCache.add(prefetchPath);
    }

    // Call original onMouseOver if it exists
    if (onMouseOver) {
      onMouseOver(event);
    }
  };

  return <Link to={to} onMouseOver={handleMouseOver} {...props} />;
};