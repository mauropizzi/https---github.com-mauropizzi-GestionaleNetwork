import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button"; // Import Button component
import { Link } from "react-router-dom"; // Import Link for navigation

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your Security Service App</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Start building your amazing project here!
        </p>
        <Link to="/service-request">
          <Button size="lg" className="px-8 py-4 text-lg">
            Go to Service Request System
          </Button>
        </Link>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;