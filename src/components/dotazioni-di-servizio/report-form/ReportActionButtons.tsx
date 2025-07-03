import React from 'react';
import { Button } from '@/components/ui/button';

interface ReportActionButtonsProps {
  isEditMode: boolean;
  vehicleInitialState: string;
  handleEmail: () => Promise<void>;
  handlePrintPdf: () => Promise<void>;
  onCancel?: () => void;
}

export const ReportActionButtons: React.FC<ReportActionButtonsProps> = ({
  isEditMode,
  vehicleInitialState,
  handleEmail,
  handlePrintPdf,
  onCancel,
}) => {
  return (
    <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <Button
        type="button"
        className="bg-blue-600 hover:bg-blue-700"
        onClick={handleEmail}
        disabled={vehicleInitialState !== "RICHIESTA MANUTENZIONE"}
      >
        EMAIL RICHIESTA MANUTENZIONE
      </Button>
      <Button type="button" className="bg-green-600 hover:bg-green-700" onClick={handlePrintPdf}>
        STAMPA PDF
      </Button>
      <Button type="submit">
        {isEditMode ? "SALVA MODIFICHE" : "REGISTRA RAPPORTO"}
      </Button>
      {isEditMode && onCancel && (
        <Button type="button" variant="outline" onClick={onCancel}>
          ANNULLA
        </Button>
      )}
    </div>
  );
};