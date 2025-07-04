import React from 'react';
import { Button } from '@/components/ui/button';

interface InterventionActionButtonsProps {
  eventId?: string;
  handleEmail: () => Promise<void>;
  handlePrintPdf: () => Promise<void>;
  handleRegisterEvent: () => void; // Changed to accept no arguments
  handleCloseEvent: () => void; // Changed to accept no arguments
  onCancel?: () => void;
  isPublicMode?: boolean; // New prop to indicate public mode
}

export const InterventionActionButtons: React.FC<InterventionActionButtonsProps> = ({
  eventId,
  handleEmail,
  handlePrintPdf,
  handleRegisterEvent,
  handleCloseEvent,
  onCancel,
  isPublicMode = false, // Default to false
}) => {
  return (
    <div className="pt-4 flex flex-wrap gap-4">
      {/* INVIA EMAIL - Questo pulsante non sarà più visualizzato nella pagina di modifica */}
      {false && (
        <Button type="button" className="w-full md:w-auto flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleEmail}>
          INVIA EMAIL
        </Button>
      )}
      {/* STAMPA PDF - Questo pulsante non sarà più visualizzato nella pagina di modifica */}
      {false && (
        <Button type="button" className="w-full md:w-auto flex-1 bg-green-600 hover:bg-green-700" onClick={handlePrintPdf}>
          STAMPA PDF
        </Button>
      )}
      {eventId ? ( // Se è un evento esistente (modalità modifica)
        <>
          <Button type="button" className="w-full md:w-auto flex-1 bg-gray-500 hover:bg-gray-600" onClick={handleRegisterEvent}>
            Salva Modifiche (In Corso)
          </Button>
          {!isPublicMode && ( // Nascondi "Chiudi Evento" in modalità pubblica
            <Button type="submit" className="w-full md:w-auto flex-1" onClick={handleCloseEvent}>
              Chiudi Evento (Completa)
            </Button>
          )}
          {onCancel && (
            <Button type="button" variant="outline" className="w-full md:w-auto flex-1" onClick={onCancel}>
              Annulla
            </Button>
          )}
        </>
      ) : ( // Se è un nuovo evento (nessun eventId)
        <>
          {/* Mostra solo "REGISTRA EVENTO" per i nuovi eventi, e solo se NON è in modalità pubblica */}
          {!isPublicMode && (
            <Button type="button" className="w-full md:w-auto flex-1 bg-gray-500 hover:bg-gray-600" onClick={handleRegisterEvent}>
              REGISTRA EVENTO
            </Button>
          )}
        </>
      )}
    </div>
  );
};