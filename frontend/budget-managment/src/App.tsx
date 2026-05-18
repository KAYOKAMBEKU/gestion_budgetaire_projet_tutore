import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./features/administration/pages/AdministrationPage";

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
