import React from "react";
import ArchivedReading from "./ArchivedReading";
import { UI_TEXT } from "../constants/index";

interface CardReading {
    // Define as needed based on actual structure
    [key: string]: any;
}

interface Reading {
    id: number;
    cardReadings?: CardReading[];
}

interface ArchivedReadingListProps {
    readings: Reading[];
    handleDeleteReading: (id: number) => void;
}

const ArchivedReadingList: React.FC<ArchivedReadingListProps> = ({ readings, handleDeleteReading }) => {
    if (!readings || readings.length === 0) {
        return (
            <div className="archive-empty">
                <p>{UI_TEXT.NO_READINGS}</p>
            </div>
        );
    }

    return (
        <div className="archive-list">
            {readings.map((reading, index) => (
                <div className="archive-item" key={reading.id}>
                    <ArchivedReading
                        reading={reading}
                        index={index}
                        onDelete={() => handleDeleteReading(reading.id)}
                    />
                </div>
            ))}
        </div>
    );
};

export default ArchivedReadingList;