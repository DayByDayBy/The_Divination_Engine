import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ReadingContainer from '../../containers/ReadingContainer';
import { readingAPI } from '../../services/api';

vi.mock('../../services/api');

vi.mock('../../components/Card.jsx', () => ({
  default: ({ card, cardDescription }: { card: { card: { name: string } }; cardDescription: string }) => (
    <div data-testid="card">
      <div className="card-name">{card.card.name}</div>
      <div className="card-description">{cardDescription}</div>
    </div>
  )
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const PENDING_SPREAD_KEY = 'pendingSpread';

const mockCards = [
  { id: 1, name: 'The Fool', nameShort: 'm00', type: 'major', meaningUp: 'New beginnings', meaningRev: 'Recklessness' },
  { id: 2, name: 'The Magician', nameShort: 'm01', type: 'major', meaningUp: 'Manifestation', meaningRev: 'Manipulation' },
  { id: 3, name: 'The High Priestess', nameShort: 'm02', type: 'major', meaningUp: 'Intuition', meaningRev: 'Secrets' },
];

async function selectSpreadAndWaitForCards() {
  const select = screen.getByRole('combobox');
  fireEvent.change(select, { target: { value: 'three-card' } });
  await waitFor(() => {
    expect(screen.getByDisplayValue('Save This Spread')).toBeInTheDocument();
  });
}

describe('Save Spread Auth Gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    (readingAPI.getRandomCards as ReturnType<typeof vi.fn>).mockResolvedValue(mockCards);
  });

  it('saves directly when user is authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      token: 'test-token',
      email: 'test@example.com',
      tier: 'FREE',
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    (readingAPI.createReading as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });

    render(
      <BrowserRouter>
        <ReadingContainer />
      </BrowserRouter>
    );

    await selectSpreadAndWaitForCards();

    const saveButton = screen.getByDisplayValue('Save This Spread');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(readingAPI.createReading).toHaveBeenCalled();
    });

    // Should NOT store in sessionStorage
    expect(sessionStorage.getItem(PENDING_SPREAD_KEY)).toBeNull();
    // Should NOT redirect to /auth
    expect(mockNavigate).not.toHaveBeenCalledWith('/auth');
  });

  it('stores spread in sessionStorage and redirects to /auth when unauthenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      token: null,
      email: null,
      tier: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ReadingContainer />
      </BrowserRouter>
    );

    await selectSpreadAndWaitForCards();

    const saveButton = screen.getByDisplayValue('Save This Spread');
    fireEvent.click(saveButton);

    await waitFor(() => {
      // Should store pending spread in sessionStorage
      const stored = sessionStorage.getItem(PENDING_SPREAD_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.cardReadings).toHaveLength(3);
      expect(parsed.cardReadings[0]).toHaveProperty('card');
      expect(parsed.cardReadings[0]).toHaveProperty('position');
      expect(parsed.cardReadings[0]).toHaveProperty('reversed');
    });

    // Should redirect to /auth
    expect(mockNavigate).toHaveBeenCalledWith('/auth');
    // Should NOT call createReading
    expect(readingAPI.createReading).not.toHaveBeenCalled();
  });
});
