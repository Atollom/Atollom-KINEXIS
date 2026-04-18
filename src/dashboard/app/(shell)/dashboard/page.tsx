import React from 'react';
import { createClient } from '@/lib/supabase';
import { getUserRole } from '@/lib/auth';

// Dashboards por rol
import DashboardVendedor from '@/components/dashboards/DashboardVendedor';
import DashboardAlmacen from '@/components/dashboards/DashboardAlmacen';
import DashboardAtollomReal from '@/components/dashboards/DashboardAtollomReal';
import DashboardOwner from '@/components/dashboards/DashboardOwner';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createClient();
  const role = await getUserRole(supabase);

  // Selector de dashboard basado en rol
  switch (role) {
    case 'agente':
      return <DashboardVendedor />;
    
    case 'almacenista':
    case 'warehouse':
      return <DashboardAlmacen />;
    
    case 'atollom_admin':
      return <DashboardAtollomReal />;
    
    case 'owner':
    case 'admin':
    case 'socia':
      return <DashboardOwner />;
    
    default:
      // Fallback para viewer u otros roles no definidos
      return <DashboardOwner />;
  }
}
