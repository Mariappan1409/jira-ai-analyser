import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Config from "./pages/Config";
import Child from "./pages/child";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/config" element={<Config />} />
        <Route path="/child/:key" element={<Child />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;