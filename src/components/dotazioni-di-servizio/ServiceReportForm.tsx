// ... (altri import rimangono invariati)

const ServiceReportForm = () => {
  // ... (altro codice rimane invariato)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        {/* Sezione Dettagli Servizio */}
        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Dettagli Servizio</h2>
          
          {/* Data e altri campi... */}

          {/* Campo Inizio Servizio con pulsante GPS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inizio Servizio (HH:MM)</FormLabel>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Input type="time" placeholder="09:00" {...field} />
                      </FormControl>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => handleSetCurrentTime('startTime')}
                      >
                        Ora Attuale
                      </Button>
                    </div>
                    <div className="mt-2">
                      <Button
                        type="button"
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleGpsTracking('start')}
                        id="startGps"
                      >
                        ACQUISIZIONE GPS INIZIO SERVIZIO
                      </Button>
                      {form.watch("startLatitude") && form.watch("startLongitude") && (
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          Posizione registrata: {form.watch("startLatitude")?.toFixed(6)}, {form.watch("startLongitude")?.toFixed(6)}
                        </p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campo Fine Servizio con pulsante GPS */}
            <div>
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fine Servizio (HH:MM)</FormLabel>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Input type="time" placeholder="17:00" {...field} />
                      </FormControl>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => handleSetCurrentTime('endTime')}
                      >
                        Ora Attuale
                      </Button>
                    </div>
                    <div className="mt-2">
                      <Button
                        type="button"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => handleGpsTracking('end')}
                        id="endGps"
                      >
                        ACQUISIZIONE GPS FINE SERVIZIO
                      </Button>
                      {form.watch("endLatitude") && form.watch("endLongitude") && (
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          Posizione registrata: {form.watch("endLatitude")?.toFixed(6)}, {form.watch("endLongitude")?.toFixed(6)}
                        </p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </section>

        {/* Resto del form rimane invariato... */}
      </form>
    </Form>
  );
};

export default ServiceReportForm;