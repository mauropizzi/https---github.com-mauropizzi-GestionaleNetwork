// Assicurati che il componente Button abbia queste varianti
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        // ... altre varianti
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)