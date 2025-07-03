import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ServiceRequestList from "./pages/ServiceRequestList";
import ServiceRequestForm from "./pages/ServiceRequestForm";
import NotFound from "./pages/NotFound";

const App = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<ServiceRequestList />} />
      <Route path="/requests" element={<ServiceRequestList />} />
      <Route path="/requests/new" element={<ServiceRequestForm />} />
      <Route path="/requests/edit/:id" element={<ServiceRequestForm />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default App;