// ... (mantieni tutto il codice precedente fino alla sezione "Controllo Accessori")

<h3 className="text-lg font-semibold mt-6 mb-4">Controllo Accessori</h3>

{/* GPS */}
<FormField
  control={form.control}
  name="gps"
  render={({ field }) => (
    <FormItem className="space-y-3">
      <FormLabel>GPS</FormLabel>
      <FormControl>
        <RadioGroup
          onValueChange={field.onChange}
          value={field.value}
          className="flex space-x-4"
        >
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <RadioGroupItem value="SI" />
            </FormControl>
            <FormLabel className="font-normal">SI</FormLabel>
          </FormItem>
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <RadioGroupItem value="NO" />
            </FormControl>
            <FormLabel className="font-normal">NO</FormLabel>
          </FormItem>
        </RadioGroup>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

{/* Apparato Radio Veicolare */}
<FormField
  control={form.control}
  name="radioVehicle"
  render={({ field }) => (
    <FormItem className="space-y-3">
      <FormLabel>Apparato Radio Veicolare</FormLabel>
      <FormControl>
        <RadioGroup
          onValueChange={field.onChange}
          value={field.value}
          className="flex space-x-4"
        >
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <RadioGroupItem value="SI" />
            </FormControl>
            <FormLabel className="font-normal">SI</FormLabel>
          </FormItem>
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <RadioGroupItem value="NO" />
            </FormControl>
            <FormLabel className="font-normal">NO</FormLabel>
          </FormItem>
        </RadioGroup>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

{/* Ripeti lo stesso pattern per tutti gli altri accessori */}
{/* Faro Brandeggiante */}
<FormField
  control={form.control}
  name="swivelingLamp"
  render={({ field }) => (
    <FormItem className="space-y-3">
      <FormLabel>Faro Brandeggiante</FormLabel>
      <FormControl>
        <RadioGroup
          onValueChange={field.onChange}
          value={field.value}
          className="flex space-x-4"
        >
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <RadioGroupItem value="SI" />
            </FormControl>
            <FormLabel className="font-normal">SI</FormLabel>
          </FormItem>
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <RadioGroupItem value="NO" />
            </FormControl>
            <FormLabel className="font-normal">NO</FormLabel>
          </FormItem>
        </RadioGroup>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

{/* Apparato Radio Portatile */}
<FormField
  control={form.control}
  name="radioPortable"
  render={({ field }) => (
    <FormItem className="space-y-3">
      <FormLabel>Apparato Radio Portatile</FormLabel>
      <FormControl>
        <RadioGroup
          onValueChange={field.onChange}
          value={field.value}
          className="flex space-x-4"
        >
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <RadioGroupItem value="SI" />
            </FormControl>
            <FormLabel className="font-normal">SI</FormLabel>
          </FormItem>
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <RadioGroupItem value="NO" />
            </FormControl>
            <FormLabel className="font-normal">NO</FormLabel>
          </FormItem>
        </RadioGroup>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

{/* Torcia Portatile */}
<FormField
  control={form.control}
  name="flashlight"
  render={({ field }) => (
    <FormItem className="space-y-3">
      <FormLabel>Torcia Portatile</FormLabel>
      <FormControl>
        <RadioGroup
          onValueChange={field.onChange}
          value={field.value}
          className="flex space-x-4"
        >
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <RadioGroupItem value="SI" />
            </FormControl>
            <FormLabel className="font-normal">SI</FormLabel>
          </FormItem>
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <RadioGroupItem value="NO" />
            </FormControl>
            <FormLabel className="font-normal">NO</FormLabel>
          </FormItem>
        </RadioGroup>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

{/* Estintore */}
<FormField
  control={form.control}
  name="extinguisher"
  render={({ field }) => (
    <FormItem className="space-y-3">
      <FormLabel>Estintore</FormLabel>
      <FormControl>
        <RadioGroup
          onValueChange={field.onChange}
          value={field.value}
          className="flex space-x-4"
        >
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <RadioGroupItem value="SI" />
            </FormControl>
            <FormLabel className="font-normal">SI</FormLabel>
          </FormItem>
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <RadioGroupItem value="NO" />
            </FormControl>
            <FormLabel className="font-normal">NO</FormLabel>
          </FormItem>
        </RadioGroup>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

{/* Ruota di Scorta */}
<FormField
  control={form.control}
  name="spareTire"
  render={({ field }) => (
    <FormItem className="space-y-3">
      <FormLabel>Ruota di Scorta</FormLabel>
      <FormControl>
        <RadioGroup
          onValueChange={field.onChange}
          value={field.value}
          className="flex space-x-4"
        >
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <RadioGroupItem value="SI" />
            </FormControl>
            <FormLabel className="font-normal">SI</FormLabel>
          </FormItem>
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <RadioGroupItem value="NO" />
            </FormControl>
            <FormLabel className="font-normal">NO</FormLabel>
          </FormItem>
        </RadioGroup>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

{/* Gilet Alta Visibilità */}
<FormField
  control={form.control}
  name="highVisibilityVest"
  render={({ field }) => (
    <FormItem className="space-y-3">
      <FormLabel>Gilet Alta Visibilità</FormLabel>
      <FormControl>
        <RadioGroup
          onValueChange={field.onChange}
          value={field.value}
          className="flex space-x-4"
        >
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <RadioGroupItem value="SI" />
            </FormControl>
            <FormLabel className="font-normal">SI</FormLabel>
          </FormItem>
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <RadioGroupItem value="NO" />
            </FormControl>
            <FormLabel className="font-normal">NO</FormLabel>
          </FormItem>
        </RadioGroup>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

// ... (mantieni tutto il resto del codice esistente)