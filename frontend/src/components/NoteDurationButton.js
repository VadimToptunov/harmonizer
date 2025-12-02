import React from 'react';

/**
 * Button component that displays a note with its duration visually
 */
const NoteDurationButton = ({ duration, isSelected, onClick, title }) => {
  const renderNote = () => {
    const size = 24;
    const centerX = size / 2;
    const centerY = size / 2;
    
    switch (duration) {
      case 'w':
        // Whole note (empty circle) - larger and more visible
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
            <ellipse
              cx={centerX}
              cy={centerY}
              rx={size * 0.4}
              ry={size * 0.25}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        );
      case 'h':
        // Half note (empty circle with stem)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
            <ellipse
              cx={centerX - 1}
              cy={centerY}
              rx={size * 0.35}
              ry={size * 0.22}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1={centerX + 3}
              y1={centerY - 5}
              x2={centerX + 3}
              y2={centerY + 7}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        );
      case 'q':
        // Quarter note (filled circle with stem)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
            <ellipse
              cx={centerX - 1}
              cy={centerY}
              rx={size * 0.35}
              ry={size * 0.22}
              fill="currentColor"
            />
            <line
              x1={centerX + 3}
              y1={centerY - 5}
              x2={centerX + 3}
              y2={centerY + 7}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        );
      case '8':
        // Eighth note (filled circle with stem and flag)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
            <ellipse
              cx={centerX - 1}
              cy={centerY}
              rx={size * 0.35}
              ry={size * 0.22}
              fill="currentColor"
            />
            <line
              x1={centerX + 3}
              y1={centerY - 5}
              x2={centerX + 3}
              y2={centerY + 7}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d={`M ${centerX + 3} ${centerY - 5} C ${centerX + 7} ${centerY - 3}, ${centerX + 8} ${centerY - 1}, ${centerX + 6} ${centerY + 2}`}
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="0.5"
            />
          </svg>
        );
      case '16':
        // Sixteenth note (filled circle with stem and double flag)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
            <ellipse
              cx={centerX - 1}
              cy={centerY}
              rx={size * 0.35}
              ry={size * 0.22}
              fill="currentColor"
            />
            <line
              x1={centerX + 3}
              y1={centerY - 5}
              x2={centerX + 3}
              y2={centerY + 7}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d={`M ${centerX + 3} ${centerY - 5} C ${centerX + 7} ${centerY - 3}, ${centerX + 8} ${centerY - 1}, ${centerX + 6} ${centerY + 1}`}
              fill="currentColor"
            />
            <path
              d={`M ${centerX + 3} ${centerY - 2} C ${centerX + 7} ${centerY}, ${centerX + 8} ${centerY + 2}, ${centerX + 6} ${centerY + 4}`}
              fill="currentColor"
            />
          </svg>
        );
      case '32':
        // Thirty-second note
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
            <ellipse
              cx={centerX - 1}
              cy={centerY}
              rx={size * 0.35}
              ry={size * 0.22}
              fill="currentColor"
            />
            <line
              x1={centerX + 3}
              y1={centerY - 5}
              x2={centerX + 3}
              y2={centerY + 7}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d={`M ${centerX + 3} ${centerY - 5} C ${centerX + 7} ${centerY - 3}, ${centerX + 8} ${centerY - 1}, ${centerX + 6} ${centerY}`}
              fill="currentColor"
            />
            <path
              d={`M ${centerX + 3} ${centerY - 2} C ${centerX + 7} ${centerY}, ${centerX + 8} ${centerY + 2}, ${centerX + 6} ${centerY + 3}`}
              fill="currentColor"
            />
            <path
              d={`M ${centerX + 3} ${centerY + 1} C ${centerX + 7} ${centerY + 3}, ${centerX + 8} ${centerY + 5}, ${centerX + 6} ${centerY + 6}`}
              fill="currentColor"
            />
          </svg>
        );
      default:
        return <span style={{ fontSize: '12px' }}>{duration}</span>;
    }
  };

  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '4px 8px',
        border: isSelected ? '2px solid #1976d2' : '1px solid #ccc',
        backgroundColor: isSelected ? '#e3f2fd' : 'white',
        cursor: 'pointer',
        minWidth: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px',
        color: isSelected ? '#1976d2' : '#333'
      }}
    >
      {renderNote()}
    </button>
  );
};

export default NoteDurationButton;

