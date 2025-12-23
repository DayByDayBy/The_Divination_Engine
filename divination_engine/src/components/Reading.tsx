import React from "react";

interface CardData {
    name: string;
    meaningUp?: string;
    meaningRev?: string;
}

interface CardItem {
    card: CardData;
    reversed: boolean;
}

interface ReadingProps {
    cards?: CardItem[];
}

const Reading: React.FC<ReadingProps> = ({ cards = [] }) => {
    return (

        <div className="meanings">
            {cards.map((card, index) => {
                return (
                    <div key={index} className = "meaning">
                        <h3>{card.card.name}</h3>
                        <p>{card.reversed ? card.card.meaningRev : card.card.meaningUp }</p>
                    </div>
                );
            })}
        </div>

    );
};

export default Reading;