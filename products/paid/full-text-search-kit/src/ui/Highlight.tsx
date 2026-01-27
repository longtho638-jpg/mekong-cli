import React from 'react';

interface HighlightProps {
  hit: any;
  attribute: string;
  className?: string;
  tagName?: string;
}

export const Highlight: React.FC<HighlightProps> = ({
  hit,
  attribute,
  className = '',
  tagName = 'mark',
}) => {
  const highlightResult = hit._highlightResult || hit._formatted;

  if (!highlightResult || !highlightResult[attribute]) {
    return <span className={className}>{hit[attribute]}</span>;
  }

  const value = highlightResult[attribute].value;

  const parts = value.split(/(<em>.*?<\/em>)/g);

  return (
    <span className={className}>
      {parts.map((part: string, index: number) => {
        if (part.startsWith('<em>') && part.endsWith('</em>')) {
          const content = part.replace('<em>', '').replace('</em>', '');
          return React.createElement(tagName, { key: index }, content);
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};
