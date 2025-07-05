import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para renderizar el fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Aquí podrías reportar el error a un servicio externo
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI cuando hay un error
      return (
        <div className="p-4 text-center">
          <h2>¡Vaya! Algo salió mal.</h2>
          <p>Por favor recarga la página o inténtalo más tarde.</p>
        </div>
      );
    }
    // Si no hay error, renderiza normalmente los children
    return this.props.children;
  }
}
