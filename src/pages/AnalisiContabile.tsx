// src/pages/AnalisiContabile.tsx
// ...
// Assuming a date picker component like <DatePicker />
// For line 88 and 105, ensure the props are correctly assigned:
<DatePicker
  selected={field.value} // 'selected' prop for the Date object
  onChange={field.onChange} // 'onChange' prop for the function
  dateFormat="dd/MM/yyyy"
  // ... other props
/>
// ...