import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import jsPDF from "jspdf";

// ... (resto del codice del componente rimane invariato)

export function ServiceReportForm() {
  // ... (implementazione del componente rimane invariata)

  const handlePrintPdf = () => {
    const values = form.getValues();
    
    // Create new PDF document
    const doc = new jsPDF();
    let y = 20; // Initial y position

    // ... (implementazione della funzione handlePrintPdf come fornita precedentemente)
  };

  return (
    // ... (JSX del componente rimane invariato)
  );
}