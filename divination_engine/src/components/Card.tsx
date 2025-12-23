import React from "react";
import { Card as CardType, CardItem } from "../types/index";

interface CardProps {
    card: CardItem;
    cardDescription?: string;
}

const Card: React.FC<CardProps> = ({ card, cardDescription }) => {
    // Use import.meta.glob for Vite to handle dynamic images
    const images = import.meta.glob('../images/*.jpg', { eager: true });
    const imgPath = (images[`../images/${card.card.nameShort}.jpg`] as any)?.default || '';

    return (
        <>
            <div className="card-object">
                <div className={card.reversed ? "card-reverse" : "card"}>
                    {imgPath ? <img src={imgPath} alt={card.card.name} /> : <div className="no-image">No Image</div>}
                </div>
                <p className="cardDescription">{cardDescription}</p> 
                <div className="name-of-card">
                </div>
            </div>
        </>
    );
};

export default Card;