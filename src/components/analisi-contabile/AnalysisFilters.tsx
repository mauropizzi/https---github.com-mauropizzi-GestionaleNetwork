import React from 'react';
import { format } from "date-fns";
import { it } from 'date-fns/locale';
import { CalendarIcon, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Cliente } from "@/lib/anagrafiche-data";

interface AnalysisFiltersProps {
  clientsList: Cliente[];
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  startDateFilter: Date | undefined;
  setStartDateFilter: (date: Date | undefined) => void;
  endDateFilter: Date | undefined;
  setEndDateFilter: (date: Date | undefined) => void;
  handleResetFilters: () => void;
  onRefresh: () => void;
  loading: boolean;
  showClientFilter?: boolean;
}

export const AnalysisFilters: React.FC<AnalysisFiltersProps> = ({
  clientsList,
  selectedClientId,
  setSelectedClientId,
  startDateFilter,
  setStartDateFilter,
  endDateFilter,
  setEndDateFilter,
  handleResetFilters,
  onRefresh,
  loading,
  showClientFilter = true,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
      {showClientFilter && (
        <div className="w-full md:w-1/3">
          <Label htmlFor="client-select">Seleziona Cliente</Label>
          <Select
            onValueChange={(value) => setSelectedClientId(value === "all" ? null : value)}
            value={selectedClientId || "all"}
            disabled={loading}
          >
            <SelectTrigger id="client-select">
              <SelectValue placeholder="Tutti i Clienti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i Clienti</SelectItem>
              {clientsList.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.nome_cliente}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full md:w-auto justify-start text-left font-normal",
              !startDateFilter && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDateFilter ? format(startDateFilter, "PPP", { locale: it }) : "Data Inizio"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDateFilter}
            onSelect={setStartDateFilter}
            initialFocus
            locale={it}
          />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full md:w-auto justify-start text-left font-normal",
              !endDateFilter && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {endDateFilter ? format(endDateFilter, "PPP", { locale: it }) : "Data Fine"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={endDateFilter}
            onSelect={setEndDateFilter}
            initialFocus
            locale={it}
          />
        </PopoverContent>
      </Popover>
      <Button onClick={handleResetFilters} variant="outline" className="mt-auto">
        Reset Filtri
      </Button>
      <Button onClick={onRefresh} disabled={loading} className="mt-auto">
        <RefreshCcw className="mr-2 h-4 w-4" /> {loading ? 'Caricamento...' : 'Aggiorna Dati'}
      </Button>
    </div>
  );
};