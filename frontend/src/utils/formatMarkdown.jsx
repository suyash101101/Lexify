import React from 'react';

export const formatMarkdownResponse = (text) => {
  if (!text) return null;

  // Handle bold text
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Split into sections (intro and points)
  const parts = text.split(/(?=\d\.)/);
  const intro = parts[0];
  const points = parts.slice(1);

  // Find closing remarks (text after numbered list)
  const closingRemarks = text.split('\n\n').slice(-1)[0].match(/^[^0-9]/) 
    ? text.split('\n\n').slice(-1)[0] 
    : null;

  return (
    <div className="space-y-4">
      {/* Introduction */}
      {intro && (
        <div 
          className="font-medium text-lg text-gray-800"
          dangerouslySetInnerHTML={{ __html: intro.trim() }}
        />
      )}
      
      {/* Numbered points */}
      {points.length > 0 && (
        <ul className="space-y-3">
          {points.map((point, index) => {
            const [number, content] = point.split('. ');
            return (
              <li key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                  {number}
                </span>
                <span 
                  className="text-gray-700 flex-1"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </li>
            );
          })}
        </ul>
      )}

      {/* Closing remarks */}
      {closingRemarks && (
        <div 
          className="mt-4 text-gray-700 italic"
          dangerouslySetInnerHTML={{ __html: closingRemarks }}
        />
      )}
    </div>
  );
};
