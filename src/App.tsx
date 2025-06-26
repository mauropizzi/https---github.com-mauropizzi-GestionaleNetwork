import { DotazioniDiServizio } from "@/pages/DotazioniDiServizio";
// ... altri import

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            {/* ... altre routes */}
            <Route path="dotazioni-di-servizio" element={<DotazioniDiServizio />} />
            {/* ... altre routes */}
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);