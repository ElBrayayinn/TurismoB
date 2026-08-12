// src/componentes/comunes/ErrorBoundary.jsx
import { Component } from 'react';

/**
 * Límite de error de React. Sin esto, cualquier excepción durante el render
 * (por ejemplo un campo nulo llegado del backend) deja al ciudadano frente a
 * una pantalla en blanco sin ninguna explicación.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || '' };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="app-crash">
        <div className="app-crash__card">
          <h1 className="app-crash__title">Algo salió mal</h1>
          <p className="app-crash__text">
            Ocurrió un error inesperado al mostrar esta sección del portal. Puedes
            recargar la página para volver a intentarlo.
          </p>
          {this.state.message && (
            <p className="app-crash__detail font-mono">{this.state.message}</p>
          )}
          <div className="app-crash__actions">
            <button className="btn-primary" onClick={this.handleReload}>
              Recargar la página
            </button>
            <a className="btn-secondary" href="/">Ir al inicio</a>
          </div>
        </div>
      </div>
    );
  }
}
