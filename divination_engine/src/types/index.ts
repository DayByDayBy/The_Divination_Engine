export interface Card {
    id: number;
    type: string;  // CardType enum from backend
    suit: string;
    nameShort: string;
    name: string;
    value: string;
    intValue: number;
    meaningUp: string;
    meaningRev: string;
    description?: string;
}

export interface CardItem {
    card: Card;
    reversed: boolean;
    position?: number;
}

export interface Reading {
    id: number;
    cardReadings?: CardItem[];
}
