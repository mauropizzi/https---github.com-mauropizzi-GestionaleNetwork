import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportSummaryDetails {
  newRecordsCount: number;
  updatedRecordsCount: number;
  invalidRecords: { row: number; data: any; errors: string[] }[];
  errors?: string[];
}

interface ImportSummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ImportSummaryDetails | null;
}

export function ImportSummaryDialog({ isOpen, onClose, summary }: ImportSummaryDialogProps) {
  if (!summary) return null;

  const hasAnomalies = summary.invalidRecords.length > 0 || (summary.errors && summary.errors.length > 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className={hasAnomalies ? "text-red-600" : "text-green-600"}>
            Riepilogo Importazione
          </DialogTitle>
          <DialogDescription>
            Dettagli sull'operazione di importazione dei dati.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 p-4 border rounded-md my-4">
          <div className="space-y-3">
            <p>
              <span className="font-semibold">Nuovi record inseriti:</span> {summary.newRecordsCount}
            </p>
            <p>
              <span className="font-semibold">Record aggiornati:</span> {summary.updatedRecordsCount}
            </p>

            {summary.invalidRecords.length > 0 && (
              <div className="text-red-700 dark:text-red-400">
                <h4 className="font-semibold mt-4 mb-2">Record non validi ({summary.invalidRecords.length}):</h4>
                <ul className="list-disc list-inside space-y-1">
                  {summary.invalidRecords.map((record, index) => (
                    <li key={index}>
                      Riga {record.row}: {record.errors.join('; ')} - Dati: {JSON.stringify(record.data)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.errors && summary.errors.length > 0 && (
              <div className="text-red-700 dark:text-red-400">
                <h4 className="font-semibold mt-4 mb-2">Errori Generali ({summary.errors.length}):</h4>
                <ul className="list-disc list-inside space-y-1">
                  {summary.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {!hasAnomalies && (summary.newRecordsCount > 0 || summary.updatedRecordsCount > 0) && (
              <p className="text-green-700 dark:text-green-400 font-semibold">
                L'importazione è stata completata senza anomalie.
              </p>
            )}
            {summary.newRecordsCount === 0 && summary.updatedRecordsCount === 0 && !hasAnomalies && (
              <p className="text-gray-600 dark:text-gray-400">
                Nessun record è stato inserito o aggiornato.
              </p>
            )}
          </div>
        </ScrollArea>
        <div className="flex justify-end">
          <Button onClick={onClose}>Chiudi</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}