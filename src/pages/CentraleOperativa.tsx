import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { servicePointsData } from '@/lib/centrale-data';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const CentraleOperativa = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    servicePoint: '',
    requestType: '',
    coOperator: '',
    requestTime: '',
    startTime: '',
    endTime: '',
    fullAccess: 'no',
    vaultAccess: 'no',
    operatorClient: '',
    gpgIntervention: '',
    anomalies: 'no',
    anomalyDescription: '',
    delay: 'no',
    delayNotes: '',
    serviceOutcome: '',
    barcode: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSetCurrentTime = (field: string) => {
    const now = new Date();
    const formattedDateTime = format(now, "yyyy-MM-dd'T'HH:mm");
    setFormData(prev => ({ ...prev, [field]: formattedDateTime }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Intervento registrato",
      description: "L'intervento è stato registrato con successo.",
    });
    console.log("Form data:", formData);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="logo-container mb-6">
        <img 
          src="/Screenshot 2025-03-21 alle 17.56.08.png" 
          alt="Vigilanza Security Logo" 
          className="max-w-full h-auto"
        />
      </div>

      <h1 className="text-2xl font-bold mb-6">Registrazione Servizi</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="service-point">Punto Servizio</Label>
          <Select 
            onValueChange={(value) => handleSelectChange('servicePoint', value)}
            value={formData.servicePoint}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleziona un punto servizio..." />
            </SelectTrigger>
            <SelectContent>
              {servicePointsData.map(point => (
                <SelectItem key={point.code} value={point.code}>
                  {point.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Intervento da effettuarsi ENTRO:</Label>
          <div className="p-2 border rounded-md">
            {formData.servicePoint ? 
              servicePointsData.find(p => p.code === formData.servicePoint)?.interventionTime + " minuti" : 
              "N/A"}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="request-type">Tipologia Servizio Richiesto</Label>
          <Select
            onValueChange={(value) => handleSelectChange('requestType', value)}
            value={formData.requestType}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleziona Tipologia Servizio..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Intervento">Intervento</SelectItem>
              <SelectItem value="Ispezione">Ispezione</SelectItem>
              <SelectItem value="Bonifica">Bonifica</SelectItem>
              <SelectItem value="Apertura">Apertura</SelectItem>
              <SelectItem value="Chiusura">Chiusura</SelectItem>
              <SelectItem value="Verifica Chiavi">Verifica Chiavi</SelectItem>
              <SelectItem value="Ritiro Chiavi">Ritiro Chiavi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Continue with other form fields following the same pattern */}
        {/* For brevity, I'll show a few more examples */}

        <div className="space-y-2">
          <Label htmlFor="co-operator">Operatore C.O. Security Service</Label>
          <Select
            onValueChange={(value) => handleSelectChange('coOperator', value)}
            value={formData.coOperator}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleziona operatore..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Lisi Bruno">LISI BRUNO</SelectItem>
              <SelectItem value="Mertoli Manuela">MERTOLI MANUELA</SelectItem>
              <SelectItem value="Scuderia Nicoletta">SCUDERI NICOLETTA</SelectItem>
              <SelectItem value="Sommese Mirco">SOMMESE MIRKO</SelectItem>
              <SelectItem value="Avarino Andrea">AVARINO ANDREA</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="request-time">Orario Richiesta C.O. Security Service</Label>
          <div className="flex gap-2">
            <Input
              type="datetime-local"
              id="request-time"
              name="requestTime"
              value={formData.requestTime}
              onChange={handleInputChange}
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline"
              onClick={() => handleSetCurrentTime('requestTime')}
            >
              Inserisci ora Attuale
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => toast({ title: "GPS confermato" })}
            >
              Conferma GPS
            </Button>
          </div>
        </div>

        {/* Add similar blocks for all other form fields */}

        <div className="pt-4">
          <Button type="submit" className="w-full">
            Chiudi Evento
          </Button>
        </div>
      </form>

      {/* History section would go here */}
    </div>
  );
};

export default CentraleOperativa;