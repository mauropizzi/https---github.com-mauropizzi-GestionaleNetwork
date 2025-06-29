import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Anagrafiche = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the ClientiPage by default when accessing /anagrafiche
    navigate("/anagrafiche/clienti", { replace: true });
  }, [navigate]);

  return (
    <div className="container mx-auto p-4">
      <p className="text-center text-muted-foreground">Reindirizzamento alla sezione Clienti...</p>
    </div>
  );
};

export default Anagrafiche;