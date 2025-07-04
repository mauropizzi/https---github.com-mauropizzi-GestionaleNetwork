import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const InProgressEventsCounter: React.FC = () => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInProgressCount = useCallback(async () => {
    setLoading(true);
    const { count: eventsCount, error } = await supabase
      .from('allarme_interventi')
      .select('id', { count: 'exact', head: true })
      .is('service_outcome', null); // Filter for events where service_outcome is NULL (in progress)

    if (error) {
      showError(`Errore nel recupero del conteggio eventi in gestione: ${error.message}`);
      console.error("Error fetching in-progress events count:", error);
      setCount(null);
    } else {
      setCount(eventsCount);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInProgressCount();
  }, [fetchInProgressCount]);

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Eventi in Gestione:</span>
      <Badge variant="secondary" className="text-lg px-3 py-1">
        {loading ? '...' : count !== null ? count : 'N/A'}
      </Badge>
      <Button variant="ghost" size="icon" onClick={fetchInProgressCount} disabled={loading} title="Aggiorna conteggio">
        <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
};