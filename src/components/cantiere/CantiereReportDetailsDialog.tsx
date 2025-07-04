import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RegistroDiCantiere } from "@/lib/anagrafiche-data";
import { format, parseISO, isValid } from "date-fns";
import { it } from 'date-fns/locale';

interface CantiereReportExtended extends RegistroDiCantiere {
  clienti: { nome_cliente: string }[];
  addetto: { nome: string; cognome: string }[];
  automezzi_utilizzati?: Array<{ tipologia: string; marca: string; targa: string }> | null;
  attrezzi_utilizzati?: Array<{ tipologia: string; marca: string; quantita: number }> | null;
}

interface CantiereReportDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  report: CantiereReportExtended | null;
}

export function CantiereReportDetailsDialog({ isOpen, onClose, report }: CantiereReportDetailsDialogProps) {
  if (!report) return null;

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    const date = parseISO(dateStr);
    return isValid(date) ? format(date, "PPP HH:mm", { locale: it }) : 'N/A';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dettagli Rapporto di Cantiere: {report.site_name}</DialogTitle>
          <DialogDescription>
            Informazioni complete sul rapporto di cantiere selezionato.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Data Rapporto:</span>
            <span className="col-span-2 text-sm">{format(parseISO(report.report_date), "PPP", { locale: it })}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Ora Rapporto:</span>
            <span className="col-span-2 text-sm">{report.report_time}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Cliente:</span>
            <span className="col-span-2 text-sm">{report.clienti[0]?.nome_cliente || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Nome Cantiere:</span>
            <span className="col-span-2 text-sm">{report.site_name}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Addetto:</span>
            <span className="col-span-2 text-sm">{`${report.addetto[0]?.nome || ''} ${report.addetto[0]?.cognome || ''}`.trim() || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-start gap-4">
            <span className="text-sm font-medium">Servizio Fornito:</span>
            <span className="col-span-2 text-sm whitespace-pre-wrap">{report.service_provided}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Inizio Servizio:</span>
            <span className="col-span-2 text-sm">{formatDateTime(report.start_datetime)}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Fine Servizio:</span>
            <span className="col-span-2 text-sm">{formatDateTime(report.end_datetime)}</span>
          </div>
          {report.latitude !== null && report.longitude !== null && (
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm font-medium">Posizione GPS:</span>
              <span className="col-span-2 text-sm">Lat: {report.latitude?.toFixed(6)}, Lon: {report.longitude?.toFixed(6)}</span>
            </div>
          )}

          {report.automezzi_utilizzati && report.automezzi_utilizzati.length > 0 && (
            <>
              <h4 className="font-semibold mt-4 mb-2 col-span-3">Automezzi Utilizzati:</h4>
              <ul className="list-disc list-inside col-span-3 space-y-1">
                {report.automezzi_utilizzati.map((auto, index) => (
                  <li key={index} className="text-sm">
                    Tipologia: {auto.tipologia}, Marca: {auto.marca}, Targa: {auto.targa}
                  </li>
                ))}
              </ul>
            </>
          )}

          {report.attrezzi_utilizzati && report.attrezzi_utilizzati.length > 0 && (
            <>
              <h4 className="font-semibold mt-4 mb-2 col-span-3">Attrezzi Utilizzati:</h4>
              <ul className="list-disc list-inside col-span-3 space-y-1">
                {report.attrezzi_utilizzati.map((attrezzo, index) => (
                  <li key={index} className="text-sm">
                    Tipologia: {attrezzo.tipologia}, Marca: {attrezzo.marca}, Quantità: {attrezzo.quantita}
                  </li>
                ))}
              </ul>
            </>
          )}

          {report.notes && (
            <div className="grid grid-cols-3 items-start gap-4">
              <span className="text-sm font-medium">Note Varie:</span>
              <span className="col-span-2 text-sm whitespace-pre-wrap">{report.notes}</span>
            </div>
          )}

          <h4 className="font-semibold mt-4 mb-2 col-span-3">Dettagli Riconsegna:</h4>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Addetto Riconsegna:</span>
            <span className="col-span-2 text-sm">{report.addetto_riconsegna_security_service || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Responsabile Committente:</span>
            <span className="col-span-2 text-sm">{report.responsabile_committente_riconsegna || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Esito Servizio:</span>
            <span className="col-span-2 text-sm">{report.esito_servizio || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-start gap-4">
            <span className="text-sm font-medium">Consegne Servizio:</span>
            <span className="col-span-2 text-sm whitespace-pre-wrap">{report.consegne_servizio || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Stato Rapporto:</span>
            <span className="col-span-2 text-sm">{report.status}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}