import React from "react";
import NavBar from "./components/NavBar";
import ReadingContainer from "./containers/ReadingContainer";
import ArchiveContainer from "./containers/ArchiveContainer";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import MainContainer from "./containers/MainContainer";
import { AuthProvider } from "./context/AuthContext";
import AuthContainer from "./containers/AuthContainer";

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <NavBar />
        <Routes>
          <Route path="/" element={<MainContainer />} />
          <Route path="/reading" element={<ReadingContainer />} />
          <Route path="/archive/*" element={< ArchiveContainer />} />
          <Route path="/auth" element={<AuthContainer />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;




