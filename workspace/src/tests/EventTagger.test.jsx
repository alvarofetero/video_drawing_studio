import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EventTagger from '../components/EventTagger';

// Mock de props necesarios
const mockEvents = [
  { id: 1, type: 'goal', timestamp: 1000 },
];
const mockOnAddEvent = vi.fn(); // Función "espía" para ver si se llama
const mockFormatTime = (time) => `${time}s`;

describe('EventTagger Component', () => {
  it('renderiza correctamente los tipos de eventos', () => {
    render(<EventTagger events={[]} onAddEvent={mockOnAddEvent} formatTime={mockFormatTime} />);
    
    // Verificamos que el título aparezca
    expect(screen.getByText(/Event Tagger/i)).toBeInTheDocument();
  });

  it('llama a onAddEvent cuando se hace clic en un botón', () => {
    render(<EventTagger events={[]} onAddEvent={mockOnAddEvent} formatTime={mockFormatTime} />);
    
    // Buscamos un botón (ej: "Gol") y hacemos click
    const goalButton = screen.getByText('Gol');
    fireEvent.click(goalButton);
    
    // Verificamos que la función fue llamada
    expect(mockOnAddEvent).toHaveBeenCalledWith('goal');
  });

  it('muestra el historial de eventos correctamente', () => {
    render(<EventTagger events={mockEvents} onAddEvent={mockOnAddEvent} formatTime={mockFormatTime} />);
    
    // Verificamos que el evento tipo 'goal' aparece en el historial
    expect(screen.getByText('GOAL')).toBeInTheDocument();
  });
});