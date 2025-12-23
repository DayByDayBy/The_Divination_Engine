import React from "react";
import NavBar from "../components/NavBar";
import ArchiveContainer from "./ArchiveContainer";
import ReadingContainer from "./ReadingContainer";
import { Routes, Route } from 'react-router-dom';

const MainContainer: React.FC = () => {
    return (
        <div className="app">
            <header>
                <h1>The DIVINATION ENGINE</h1>
            </header>
            <main>
                <Routes>
                    <Route path="/" element={<ReadingContainer />} />
                    <Route path="/archive" element={<ArchiveContainer />} />
                    <Route path="/archive/:id" element={<ArchiveContainer />} />
                </Routes>
            </main>
        </div>
    );
}

export default MainContainer;
