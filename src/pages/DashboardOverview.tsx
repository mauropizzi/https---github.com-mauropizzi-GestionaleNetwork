import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button"; // Import Button component
import { Link } from "react-router-dom"; // Import Link for navigation

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold mb-4">Benvenuto nella tua App per i Servizi di Sicurezza</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Inizia a costruire il tuo fantastico progetto qui!
        </p>
        <div className="flex flex-col space-y-4">
          <Link to="/service-request">
            <Button size="lg" className="px-8 py-4 text-lg w-full">
              Vai al Sistema di Richiesta Servizi
            </Button>
          </Link>
          <Link to="/anagrafiche">
            <Button size="lg" className="px-8 py-4 text-lg w-full">
              Vai alla Gestione Anagrafiche
            </Button>
          </Link>
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;