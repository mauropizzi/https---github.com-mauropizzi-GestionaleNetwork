import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Unauthorized = () => {
  const handleGoToLogin = () => {
    window.location.href = "/login"; // Force a full page reload to /login
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <ShieldAlert className="mx-auto h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-4xl font-bold mb-4">Accesso Negato</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Non disponi delle autorizzazioni necessarie per visualizzare questa pagina.
        </p>
        <Button size="lg" onClick={handleGoToLogin}>Torna al Login</Button>
      </div>
    </div>
  );
};

export default Unauthorized;