import React, { useState, useEffect } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import {
  servicePointsData,
  requestTypeOptions,
  coOperatorOptions,
  operatorClientOptions,
  gpgInterventionOptions,
  serviceOutcomeOptions,
} from '@/lib/centrale-data';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { sendEmail } from "@/utils/email"; // Import sendEmail utility
import { RECIPIENT_EMAIL } from "@/lib/config"; // Import recipient email

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
    barcode: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSetCurrentTime = (field: string) => {
    const now = new Date();
    const formattedDateTime = format(now, "yyyy-MM-dd'T'HH:mm");
    setFormData(prev => ({ ...prev, [field]: formattedDateTime }));
  };

  const handleGpsTracking = () => {
    if (navigator.geolocation) {
      showInfo("Acquisizione posizione GPS...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({ ...prev, latitude, longitude }));
          showSuccess(`Posizione GPS acquisita: Lat ${latitude.toFixed(6)}, Lon ${longitude.toFixed(6)}`);
        },
        (error) => {
          showError(`Errore acquisizione GPS: ${error.message}`);
          console.error("Error getting GPS position:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      showError("La geolocalizzazione non è supportata dal tuo browser.");
    }
  };

  const handleEmail = () => {
    const servicePointName = servicePointsData.find(p => p.code === formData.servicePoint)?.name || formData.servicePoint || 'N/A';
    const subject = `Rapporto Intervento Centrale Operativa - ${servicePointName} - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;
    
    let body = `Dettagli Rapporto Intervento:\n\n`;
    body += `Punto Servizio: ${servicePointName}\n`;
    body += `Intervento da effettuarsi ENTRO: ${servicePointsData.find(p => p.code === formData.servicePoint)?.interventionTime || 'N/A'} minuti\n`;
    body += `Tipologia Servizio Richiesto: ${formData.requestType}\n`;
    body += `Operatore C.O. Security Service: ${formData.coOperator}\n`;
    body += `Orario Richiesta C.O. Security Service: ${formData.requestTime ? format(new Date(formData.requestTime), 'dd/MM/yyyy HH:mm') : 'N/A'}\n`;
    if (formData.latitude !== undefined && formData.longitude !== undefined) {
      body += `Posizione GPS: Lat ${formData.latitude.toFixed(6)}, Lon ${formData.longitude.toFixed(6)}\n`;
    }
    body += `Orario Inizio Intervento: ${formData.startTime ? format(new Date(formData.startTime), 'dd/MM/yyyy HH:mm') : 'N/A'}\n`;
    body += `Orario Fine Intervento: ${formData.endTime ? format(new Date(formData.endTime), 'dd/MM/yyyy HH:mm') : 'N/A'}\n`;
    body += `Accesso Completo: ${formData.fullAccess.toUpperCase()}\n`;
    body += `Accesso Caveau: ${formData.vaultAccess.toUpperCase()}\n`;
    body += `Operatore Cliente: ${formData.operatorClient || 'N/A'}\n`;
    body += `G.P.G. Intervento: ${formData.gpgIntervention || 'N/A'}\n`;
    body += `Anomalie Riscontrate: ${formData.anomalies.toUpperCase()}\n`;
    if (formData.anomalies === 'si') {
      body += `Descrizione Anomalie: ${formData.anomalyDescription || 'N/A'}\n`;
    }
    body += `Ritardo: ${formData.delay.toUpperCase()}\n`;
    if (formData.delay === 'si') {
      body += `Motivo Ritardo: ${formData.delayNotes || 'N/A'}\n`;
    }
    body += `Esito Servizio: ${formData.serviceOutcome || 'N/A'}\n`;
    body += `Barcode: ${formData.barcode || 'N/A'}\n`;

    sendEmail(subject, body);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Intervento registrato",
      description: "L'intervento è stato registrato con successo.",
    });
    console.log("Form data:", formData);
    // Here you would typically send the data to Supabase or another backend
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
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
              {requestTypeOptions.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
              {coOperatorOptions.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
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
          </div>
        </div>

        {/* GPS Acquisition Button and Display */}
        <div className="space-y-2">
          <Button 
            type="button" 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            onClick={handleGpsTracking}
          >
            ACQUISIZIONE POSIZIONE GPS
          </Button>
          {formData.latitude !== undefined && formData.longitude !== undefined && (
            <p className="text-sm text-gray-500 mt-1 text-center">
              Latitudine: {formData.latitude?.toFixed(6)}, Longitudine: {formData.longitude?.toFixed(6)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Orario Inizio Intervento</Label>
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline"
                onClick={() => handleSetCurrentTime('startTime')}
              >
                Ora Attuale
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">Orario Fine Intervento</Label>
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline"
                onClick={() => handleSetCurrentTime('endTime')}
              >
                Ora Attuale
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Accesso Completo</Label>
          <RadioGroup
            value={formData.fullAccess}
            onValueChange={(value) => handleRadioChange('fullAccess', value)}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="si" id="fullAccessSi" />
              <Label htmlFor="fullAccessSi">SI</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="fullAccessNo" />
              <Label htmlFor="fullAccessNo">NO</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Accesso Caveau</Label>
          <RadioGroup
            value={formData.vaultAccess}
            onValueChange={(value) => handleRadioChange('vaultAccess', value)}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="si" id="vaultAccessSi" />
              <Label htmlFor="vaultAccessSi">SI</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="vaultAccessNo" />
              <Label htmlFor="vaultAccessNo">NO</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="operator-client">Operatore Cliente</Label>
          <Select
            onValueChange={(value) => handleSelectChange('operatorClient', value)}
            value={formData.operatorClient}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleziona operatore cliente..." />
            </SelectTrigger>
            <SelectContent>
              {operatorClientOptions.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gpg-intervention">G.P.G. Intervento</Label>
          <Select
            onValueChange={(value) => handleSelectChange('gpgIntervention', value)}
            value={formData.gpgIntervention}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleziona G.P.G. intervento..." />
            </SelectTrigger>
            <SelectContent>
              {gpgInterventionOptions.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Anomalie Riscontrate</Label>
          <RadioGroup
            value={formData.anomalies}
            onValueChange={(value) => handleRadioChange('anomalies', value)}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="si" id="anomaliesSi" />
              <Label htmlFor="anomaliesSi">SI</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="anomaliesNo" />
              <Label htmlFor="anomaliesNo">NO</Label>
            </div>
          </RadioGroup>
          {formData.anomalies === 'si' && (
            <Textarea
              id="anomalyDescription"
              name="anomalyDescription"
              placeholder="Descrivi le anomalie riscontrate..."
              value={formData.anomalyDescription}
              onChange={handleInputChange}
              className="mt-2"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label>Ritardo</Label>
          <RadioGroup
            value={formData.delay}
            onValueChange={(value) => handleRadioChange('delay', value)}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="si" id="delaySi" />
              <Label htmlFor="delaySi">SI</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="delayNo" />
              <Label htmlFor="delayNo">NO</Label>
            </div>
          </RadioGroup>
          {formData.delay === 'si' && (
            <Textarea
              id="delayNotes"
              name="delayNotes"
              placeholder="Motivo del ritardo..."
              value={formData.delayNotes}
              onChange={handleInputChange}
              className="mt-2"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="service-outcome">Esito Servizio</Label>
          <Select
            onValueChange={(value) => handleSelectChange('serviceOutcome', value)}
            value={formData.serviceOutcome}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleziona esito..." />
            </SelectTrigger>
            <SelectContent>
              {serviceOutcomeOptions.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="barcode">Barcode</Label>
          <Input
            type="text"
            id="barcode"
            name="barcode"
            placeholder="Inserisci barcode..."
            value={formData.barcode}
            onChange={handleInputChange}
          />
        </div>

        <div className="pt-4 flex gap-4">
          <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleEmail}>
            INVIA EMAIL
          </Button>
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