import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Carousel, type CarouselSlide } from './carousel';

function piezas(cantidad: number): CarouselSlide[] {
  return Array.from({ length: cantidad }, (_, i) => ({
    id: `p${i + 1}`,
    label: `Pieza ${i + 1}`,
    content: <p>Contenido {i + 1}</p>,
  }));
}

/** Sustituye la preferencia del sistema durante una prueba. */
function pedirMovimientoReducido(reducir: boolean): void {
  window.matchMedia = ((consulta: string) => ({
    matches: reducir,
    media: consulta,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  vi.useRealTimers();
  pedirMovimientoReducido(false);
});

describe('Carousel', () => {
  // Nace vacío y así se queda un tiempo, así que este es el estado que más se
  // va a ver. Un control que no lleva a ninguna parte lo haría parecer roto.
  it('sin piezas no presenta controles ni anuncia contenido', () => {
    render(<Carousel slides={[]} label="Novedades" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('con una sola pieza la muestra sin controles, porque no hay a dónde ir', () => {
    render(<Carousel slides={piezas(1)} label="Novedades" />);

    expect(screen.getByText('Contenido 1')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Pieza siguiente' })).not.toBeInTheDocument();
  });

  it('avanza solo cada intervalo', () => {
    vi.useFakeTimers();
    render(<Carousel slides={piezas(3)} label="Novedades" intervalMs={1000} />);

    expect(screen.getByText('Contenido 1')).toBeVisible();

    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText('Contenido 2')).toBeVisible();
    expect(screen.getByText('Contenido 1')).not.toBeVisible();

    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText('Contenido 3')).toBeVisible();
  });

  it('se navega con los controles y señala la pieza activa', async () => {
    const user = userEvent.setup();
    render(<Carousel slides={piezas(3)} label="Novedades" />);

    await user.click(screen.getByRole('button', { name: 'Pieza siguiente' }));
    expect(screen.getByText('Contenido 2')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Ir a la pieza 2' })).toHaveAttribute(
      'aria-current',
      'true',
    );

    // Retroceder desde la primera da la vuelta en lugar de quedarse atascado.
    await user.click(screen.getByRole('button', { name: 'Pieza anterior' }));
    await user.click(screen.getByRole('button', { name: 'Pieza anterior' }));
    expect(screen.getByText('Contenido 3')).toBeVisible();
  });

  it('deja de avanzar solo mientras el foco esté dentro', () => {
    vi.useFakeTimers();
    render(<Carousel slides={piezas(3)} label="Novedades" intervalMs={1000} />);

    act(() => { screen.getByRole('button', { name: 'Pieza siguiente' }).focus(); });
    act(() => { vi.advanceTimersByTime(3000); });

    // Tres intervalos completos y sigue en la primera: nadie le quitó de
    // delante lo que estaba mirando.
    expect(screen.getByText('Contenido 1')).toBeVisible();
  });

  it('con movimiento reducido no avanza solo, pero sus controles siguen sirviendo', () => {
    pedirMovimientoReducido(true);
    vi.useFakeTimers();
    render(<Carousel slides={piezas(3)} label="Novedades" intervalMs={1000} />);

    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByText('Contenido 1')).toBeVisible();

    // `fireEvent` y no `userEvent`: este último espera con temporizadores
    // propios, y aquí el reloj está congelado a propósito.
    fireEvent.click(screen.getByRole('button', { name: 'Pieza siguiente' }));
    expect(screen.getByText('Contenido 2')).toBeVisible();
  });
});
