import React from "react";
import Spread from "./Spread";
import Reading from "./Reading";
import { Reading as ReadingType } from "../types/index";

interface ArchiveItemProps {
    reading: ReadingType;
}

const ArchiveItem: React.FC<ArchiveItemProps> = ({ reading }) => {
    return (
        <div className="reading-container">
            <Spread cards={reading.cardReadings || []} />
            <Reading cards={reading.cardReadings || []} />
            {reading.llmInterpretation && (
                <div className="interpretation">
                    <h3>Interpretation</h3>
                    <p>{reading.llmInterpretation}</p>
                </div>
            )}
        </div>
    );
};

export default ArchiveItem;