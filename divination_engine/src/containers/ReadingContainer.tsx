import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Spread from "../components/Spread";
import Reading from "../components/Reading";
import { readingAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { SPREAD_TYPES, SPREAD_CARD_COUNTS, UI_TEXT, ERROR_MESSAGES } from "../constants/index";
import { CardItem } from "../types/index";

const ReadingContainer: React.FC = () => {
    const [selectedSpread, setSelectedSpread] = useState<string>('');
    const [cards, setCards] = useState<CardItem[] | null>(null);
    const [saving, setSaving] = useState<boolean>(false);
    const [saveMessage, setSaveMessage] = useState<string>('');
    const [interpretation, setInterpretation] = useState<string | null>(null);
    const [interpreting, setInterpreting] = useState<boolean>(false);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const handleSpreadChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedSpread(event.target.value);
        setInterpretation(null);
        setSaveMessage('');
    };

    const handleSaveSpread = async () => {
        const newReading = {
            cardReadings: (cards || []).map((cardItem, index) => ({
                card: cardItem.card,
                reversed: cardItem.reversed,
                position: index,
            })),
        };

        if (!isAuthenticated) {
            sessionStorage.setItem('pendingSpread', JSON.stringify(newReading));
            navigate('/auth');
            return;
        }

        try {
            setSaving(true);
            const created = await readingAPI.createReading(newReading);
            setSaveMessage(UI_TEXT.SAVE_SUCCESS);

            setInterpreting(true);
            const text = await readingAPI.interpretReading(
                created.id,
                cards || [],
                selectedSpread,
            );
            setInterpretation(text);
        } catch (error) {
            console.error(ERROR_MESSAGES.SAVE_READING_FAILED, error);
            setSaveMessage(UI_TEXT.SAVE_FAILED);
        } finally {
            setSaving(false);
            setInterpreting(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const cardCount = SPREAD_CARD_COUNTS[selectedSpread];
            if (cardCount > 0) {
                try {
                    const cardsData = await readingAPI.getRandomCards(cardCount);
                    const cardReadings = cardsData.map((card, index) => ({
                        reversed: Math.random() < 0.5,
                        position: index,
                        card,
                    }));
                    setCards(cardReadings);
                } catch (error) {
                    console.error(ERROR_MESSAGES.FETCH_CARDS_FAILED, error);
                }
            }
        };

        fetchData();
    }, [selectedSpread]);

    return (
        <div className="reading-container">
            <div className="reading-dropdown">
                <select value={selectedSpread} onChange={handleSpreadChange}>
                    <option value="">{UI_TEXT.SELECT_SPREAD}</option>
                    <option value={SPREAD_TYPES.THREE_CARD}>{UI_TEXT.THREE_CARD_LABEL}</option>
                    <option value={SPREAD_TYPES.CELTIC_CROSS}>{UI_TEXT.CELTIC_CROSS_LABEL}</option>
                </select>
            </div>

            {saveMessage && (
                <div className={`message ${saveMessage === UI_TEXT.SAVE_SUCCESS ? 'success' : 'error'}`}>
                    {saveMessage}
                </div>
            )}

            {cards ? (
                <>
                    <Spread cards={cards} />
                    <div className="reading-actions">
                        {!interpretation && (
                            <input
                                type="submit"
                                className="save-button"
                                name="submit"
                                value={saving ? UI_TEXT.SAVING : UI_TEXT.SAVE_SPREAD}
                                onClick={handleSaveSpread}
                                disabled={saving || interpreting}
                            />
                        )}
                        {interpretation && (
                            <button
                                className="archive-button"
                                onClick={() => navigate('/archive')}
                            >
                                View in Archive
                            </button>
                        )}
                    </div>
                    <Reading cards={cards} />
                    {interpreting && (
                        <div className="loading">Generating interpretation...</div>
                    )}
                    {interpretation && (
                        <div className="interpretation">
                            <h3>Interpretation</h3>
                            <p>{interpretation}</p>
                        </div>
                    )}
                </>
            ) : selectedSpread ? (
                <div className="loading">{UI_TEXT.LOADING}</div>
            ) : null}
        </div>
    );
};

export default ReadingContainer;