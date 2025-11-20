import React from 'react';

const Highlight = ({ text = '', highlight = '' }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }

  // Escape special characters for use in a regular expression
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\\]/g, '\\$&'); // $& means the whole matched string
  };

  const escapedHighlight = escapeRegExp(highlight);
  const regex = new RegExp(`(${escapedHighlight})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        // The matched part will be at the odd position, so we check for i % 2 === 1
        i % 2 === 1 ? (
          <mark key={i} className="bg-yellow-300 text-black px-0">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export default Highlight;
