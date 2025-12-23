import React from "react";
import Card from "./Card";
import { CARD_POSITIONS, SPREAD_CARD_COUNTS, SPREAD_TYPES } from "../constants/index";
import { CardItem } from "../types/index";

interface SpreadProps {
    cards: CardItem[];
}

const Spread: React.FC<SpreadProps> = ({ cards }) => {

    let cardsForRender: React.ReactElement[] = []
    if(cards.length > 0){
        cardsForRender = cards.map((card, index) => {
            let cardDescription = null;

            if (cards.length === SPREAD_CARD_COUNTS[SPREAD_TYPES.THREE_CARD]) {
                cardDescription = CARD_POSITIONS.THREE_CARD[index];
            } else {
                cardDescription = CARD_POSITIONS.CELTIC_CROSS[index];
            }
            return <Card key={index} card={card} cardDescription={cardDescription} />
        });
    }

    return (
        <div className={ cardsForRender.length < 4 ? "spread-three" : "spread-ten"}>
            {cardsForRender}
        </div>
    );
};

export default Spread;
