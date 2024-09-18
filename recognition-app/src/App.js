import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Registeration from "./comps/Registeration";
import Login from "./comps/Login";
import MachineTraining from "./comps/MachineTraining";
import NotFound from "./comps/NotFound";
import Home from "./comps/Home";
import { ProtectedRoute } from "./comps/ProtectedRoutes"

function App() {
  return (
    <div className="app-container">
      <Router>
        <Routes>
          <Route exact path="/" element={< Login />} />
          <Route path="/register" element={<Registeration />} />
          <Route path="/train" element={
            <ProtectedRoute>
              <MachineTraining />
            </ProtectedRoute>

          } />
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/*" element={<NotFound />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
