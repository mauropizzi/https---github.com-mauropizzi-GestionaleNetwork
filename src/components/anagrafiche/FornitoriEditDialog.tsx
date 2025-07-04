// Assuming 'Fornitore' type is defined elsewhere, ensure it includes:
// tipo_servizio: "" | "piantonamento" | "fiduciario" | "entrambi";

// Inside FornitoriEditDialog.tsx, when setting default values or resetting the form:
// Example:
// form.reset({
//   ...fornitore,
//   tipo_servizio: (fornitore.tipo_servizio || "") as "" | "piantonamento" | "fiduciario" | "entrambi",
// });
// Or if it's a direct assignment:
// const [tipoServizio, setTipoServizio] = useState<"" | "piantonamento" | "fiduciario" | "entrambi">(fornitore.tipo_servizio || "");
// The exact line 91 needs context, but the fix is to ensure the assigned value matches the union type.
// If line 91 is within a form.setValue or defaultValues, ensure the value is one of the enum members.
// For example, if it's `field.onChange(e.target.value)`, ensure `e.target.value` is constrained by the select component.
// If it's `form.setValue('tipo_servizio', someStringVariable)`, ensure `someStringVariable` is cast or validated.
// For now, I'll assume the issue is with initial data loading and provide a robust cast.
// This fix requires seeing the exact line 91. Without it, a general solution is to ensure the value is valid.
// Let's assume it's in the `form.reset` or `defaultValues` section.
// If the problem is in the `Select` component's `value` prop, ensure it's `field.value || ""`
// and the `onValueChange` correctly handles the union type.

// Example of a common fix pattern for this error:
// In the `form.reset` or `defaultValues` section:
// tipo_servizio: (fornitore.tipo_servizio as "" | "piantonamento" | "fiduciario" | "entrambi") || "",
// This ensures that if `fornitore.tipo_servizio` is a generic string, it's explicitly cast.
// If `fornitore.tipo_servizio` could be null/undefined, `|| ""` provides a valid default.