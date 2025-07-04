import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PuntoServizio } from "@/lib/anagrafiche-data"; // Assuming PuntoServizio type is defined here
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

interface PuntoServizioDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  puntoServizioId: string | null;
}

export function PuntoServizioDetailsDialog({
  isOpen,
  onClose,
  puntoServizioId,
}: PuntoServizioDetailsDialogProps) {
  const [puntoServizio, setPuntoServizio] = useState<PuntoServizio | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPuntoServizioDetails() {
      if (!puntoServizioId) {
        setPuntoServizio(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from("punti_servizio")
        .select(
          `
          *,
          clienti(nome_cliente),
          fornitori(nome),
          procedure_speciali(nome_procedura)
        `
        )
        .eq("id", puntoServizioId)
        .single();

      if (error) {
        showError(`Errore nel recupero dei dettagli del punto servizio: ${error.message}`);
        console.error("Error fetching punto servizio details:", error);
        setPuntoServizio(null);
      } else {
        setPuntoServizio(data);
      }
      setIsLoading(false);
    }

    fetchPuntoServizioDetails();
  }, [puntoServizioId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dettagli Punto Servizio</DialogTitle>
          <DialogDescription>
            Visualizza le informazioni complete del punto servizio.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="text-center py-8">Caricamento dettagli...</div>
        ) : puntoServizio ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome_punto_servizio" className="text-right">
                Nome Punto Servizio
              </Label>
              <Input
                id="nome_punto_servizio"
                value={puntoServizio.nome_punto_servizio || ""}
                readOnly
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cliente" className="text-right">
                Cliente
              </Label>
              <Input
                id="cliente"
                // Access nome_cliente from the nested 'clienti' object
                value={puntoServizio.clienti?.nome_cliente || "N/A"}
                readOnly
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fornitore" className="text-right">
                Fornitore
              </Label>
              <Input
                id="fornitore"
                // Access nome from the nested 'fornitori' object
                value={puntoServizio.fornitori?.nome || "N/A"} // Corrected access
                readOnly
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="indirizzo" className="text-right">
                Indirizzo
              </Label>
              <Input
                id="indirizzo"
                value={puntoServizio.indirizzo || ""}
                readOnly
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="citta" className="text-right">
                Città
              </Label>
              <Input
                id="citta"
                value={puntoServizio.citta || ""}
                readOnly
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cap" className="text-right">
                CAP
              </Label>
              <Input
                id="cap"
                value={puntoServizio.cap || ""}
                readOnly
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="provincia" className="text-right">
                Provincia
              </Label>
              <Input
                id="provincia"
                value={puntoServizio.provincia || ""}
                readOnly
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefono" className="text-right">
                Telefono
              </Label>
              <Input
                id="telefono"
                value={puntoServizio.telefono || ""}
                readOnly
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                value={puntoServizio.email || ""}
                readOnly
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="referente" className="text-right">
                Referente
              </Label>
              <Input
                id="referente"
                value={puntoServizio.referente || ""}
                readOnly
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="note" className="text-right">
                Note
              </Label>
              <Textarea
                id="note"
                value={puntoServizio.note || ""}
                readOnly
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="attivo" className="text-right">
                Attivo
              </Label>
              <Checkbox
                id="attivo"
                checked={puntoServizio.attivo ?? false} // Corrected access and default
                disabled
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="procedure_speciali" className="text-right">
                Procedure Speciali
              </Label>
              <Textarea
                id="procedure_speciali"
                value={puntoServizio.procedure_speciali?.nome_procedura || "N/A"} // Corrected access
                readOnly
                className="col-span-3"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-red-500">
            Dettagli punto servizio non trovati.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}