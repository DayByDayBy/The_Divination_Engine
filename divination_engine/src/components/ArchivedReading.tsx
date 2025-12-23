import React from "react";
import { useNavigate } from "react-router-dom";
import { UI_TEXT, ROUTES } from "../constants/index";

interface Reading {
    id: number;
}

interface ArchivedReadingProps {
    reading: Reading;
    index: number;
    onDelete: () => void;
}

const ArchivedReading: React.FC<ArchivedReadingProps> = ({ reading, index, onDelete }) => {
    const navigate = useNavigate();

    const viewReading = () => {
        navigate(`${ROUTES.ARCHIVE}/${reading.id}`);
    }
    

    return (
        <>

            <p>Reading {index + 1}</p>
            <button className="save-button" onClick={viewReading}>{UI_TEXT.VIEW_BUTTON}</button>
            <button className="delete-button" onClick={onDelete}>{UI_TEXT.DELETE_BUTTON}</button>

        </>
    )
};

export default ArchivedReading;