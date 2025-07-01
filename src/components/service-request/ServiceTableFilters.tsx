import React from "react";
import { format } from "date-fns";
import { it } from 'date-fns/locale';
import { CalendarIcon, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface ServiceTableFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  startDateFilter: Date | undefined;
  setStartDateFilter: (date: Date | undefined) => void;
  endDateFilter: Date | undefined;
  setEndDateFilter: (date: Date | undefined) => void;
  handleResetFilters: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export const ServiceTableFilters: React.FC<ServiceTableFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  startDateFilter,
  setStartDateFilter,
  endDateFilter,
  setEndDateFilter,
  handleResetFilters,
  onRefresh,
  loading,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
      <Input
        placeholder="Cerca per tipo, cliente, punto servizio..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
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
      <Button variant="outline" onClick={handleResetFilters}>
        Reset Filtri
      </Button>
      <Button variant="outline" onClick={onRefresh} disabled={loading}>
        <RefreshCcw className="mr-2 h-4 w-4" /> {loading ? 'Caricamento...' : 'Aggiorna Dati'}
      </Button>
    </div>
  );
};