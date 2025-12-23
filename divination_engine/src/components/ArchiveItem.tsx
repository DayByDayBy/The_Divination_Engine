import React from "react";
import Spread from "./Spread";
import { CardItem, Reading } from "../types/index";

interface ArchiveItemProps {
    reading: Reading;
}

const ArchiveItem: React.FC<ArchiveItemProps> = ({reading}) => {

    return (
    
    
    <>
       <div className="reading-container">
        <Spread cards={reading.cardReadings || []} />
        </div>
    </>
    )
};

export default ArchiveItem;