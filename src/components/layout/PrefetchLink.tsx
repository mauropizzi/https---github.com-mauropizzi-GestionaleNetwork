import React, { ComponentType } from 'react';
import { Link, LinkProps } from 'react-router-dom';

// A simple in-memory cache for prefetched routes
const prefetchCache = new Set<string>();

// Mapping of route paths to their dynamic import function
// This must be kept in sync with the routes in App.tsx
const routePrefetchMap: { [key: string]: () => Promise<any> } = {
  '/': () => import('@/pages/CentraleOperativa.tsx'),
  '/service-request': () => import('@/pages/ServiceRequest.tsx'),
  '/anagrafiche': () => import('@/pages/Anagrafiche.tsx'),
  '/anagrafiche/clienti': () => import('@/pages/ClientiPage.tsx'),
  '/anagrafiche/punti-servizio': () => import('@/pages/PuntiServizioPage.tsx'),
  '/anagrafiche/personale': () => import('@/pages/PersonalePage.tsx'),
  '/anagrafiche/operatori-network': () => import('@/pages/OperatoriNetworkPage.tsx'),
  '/anagrafiche/fornitori': () => import('@/pages/FornitoriPage.tsx'),
  '/anagrafiche/tariffe': () => import('@/pages/TariffePage.tsx'),
  '/anagrafiche/procedure': () => import('@/pages/ProcedurePage.tsx'),
  '/dotazioni-di-servizio': () => import('@/pages/DotazioniDiServizio.tsx'),
  '/service-list': () => import('@/pages/ServiceList.tsx'),
  '/registro-di-cantiere': () => import('@/pages/RegistroDiCantiere.tsx'),
  '/servizi-a-canone': () => import('@/pages/ServiziCanone.tsx'),
  '/incoming-emails': () => import('@/pages/IncomingEmails.tsx'),
  '/analisi-contabile': () => import('@/pages/AnalisiContabile.tsx'),
  '/richiesta-manutenzione': () => import('@/pages/RichiestaManutenzione.tsx'), // New route
  '/access-management': () => import('@/pages/AccessManagementPage.tsx'), // New route
};

export const PrefetchLink: React.FC<LinkProps> = ({ to, onMouseOver, ...props }) => {
  const handleMouseOver = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const path = typeof to === 'string' ? to.split('?')[0] : to.pathname;

    if (path && routePrefetchMap[path] && !prefetchCache.has(path)) {
      console.log(`Prefetching route: ${path}`);
      routePrefetchMap[path]();
      prefetchCache.add(path);
    }

    // Call original onMouseOver if it exists
    if (onMouseOver) {
      onMouseOver(event);
    }
  };

  return <Link to={to} onMouseOver={handleMouseOver} {...props} />;
};