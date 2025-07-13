// src/components/Pagination.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './Pagination.css';

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  showPageNumbers = false,
  className = '' 
}) {
  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const handlePageClick = page => onPageChange(page);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const start = Math.max(1, currentPage - 2);
      const end   = Math.min(totalPages, currentPage + 2);
      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginación" className={`pagination-container ${className}`}>
      <ul className="pagination">
        {/* Anterior */}
        <li className={`pagination__item ${currentPage === 1 ? 'disabled' : ''}`}>
          <button
            className="pagination__link pagination__link--prev"
            onClick={handlePrevious}
            disabled={currentPage === 1}
            aria-label="Página anterior"
          >
            <svg className="pagination__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </li>

        {/* Números de página (opcional) */}
        {showPageNumbers && getPageNumbers().map((page, idx) => (
          <li 
            key={idx}
            className={`pagination__item ${
              page === currentPage ? 'active' : ''
            } ${page === '...' ? 'disabled' : ''}`}
          >
            {page === '...' ? (
              <span className="pagination__link pagination__ellipsis">…</span>
            ) : (
              <button
                className="pagination__link pagination__link--number"
                onClick={() => handlePageClick(page)}
                aria-label={`Página ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            )}
          </li>
        ))}

        {/* Info de página cuando no hay números */}
        {!showPageNumbers && (
          <li className="pagination__item pagination__info">
            <span className="pagination__link pagination__current">
              Página {currentPage} de {totalPages}
            </span>
          </li>
        )}

        {/* Siguiente */}
        <li className={`pagination__item ${currentPage === totalPages ? 'disabled' : ''}`}>
          <button
            className="pagination__link pagination__link--next"
            onClick={handleNext}
            disabled={currentPage === totalPages}
            aria-label="Página siguiente"
          >
            <svg className="pagination__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </li>
      </ul>
    </nav>
  );
}

Pagination.propTypes = {
  currentPage:    PropTypes.number.isRequired,
  totalPages:     PropTypes.number.isRequired,
  onPageChange:   PropTypes.func.isRequired,
  showPageNumbers:PropTypes.bool,
  className:      PropTypes.string
};
