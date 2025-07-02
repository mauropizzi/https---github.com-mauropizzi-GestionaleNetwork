import React from 'react';
import { Button } from '@/components/ui/button';

interface InterventionActionButtonsProps {
  eventId?: string;
  handleEmail: () => Promise<void>;
  handlePrintPdf: () => Promise<void>;
  handleRegisterEvent: (e: React.FormEvent) => void;
  handleCloseEvent: (e: React.FormEvent) => void;
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
      {!isPublicMode && (
        <Button type="button" className="w-full md:w-auto flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleEmail}>
          INVIA EMAIL
        </Button>
      )}
      <Button type="button" className="w-full md:w-auto flex-1 bg-green-600 hover:bg-green-700" onClick={handlePrintPdf}>
        STAMPA PDF
      </Button>
      {eventId ? (
        <>
          <Button type="button" className="w-full md:w-auto flex-1 bg-gray-500 hover:bg-gray-600" onClick={handleRegisterEvent}>
            Salva Modifiche (In Corso)
          </Button>
          {!isPublicMode && ( // Hide "Chiudi Evento" in public mode
            <Button type="submit" className="w-full md:w-auto flex-1">
              Chiudi Evento (Completa)
            </Button>
          )}
          {onCancel && (
            <Button type="button" variant="outline" className="w-full md:w-auto flex-1" onClick={onCancel}>
              Annulla
            </Button>
          )}
        </>
      ) : (
        <>
          {!isPublicMode && ( // Hide "REGISTRA EVENTO" and "Chiudi Evento" in public mode for new events
            <>
              <Button type="button" className="w-full md:w-auto flex-1 bg-gray-500 hover:bg-gray-600" onClick={handleRegisterEvent}>
                REGISTRA EVENTO
              </Button>
              <Button type="submit" className="w-full md:w-auto flex-1">
                Chiudi Evento
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
};