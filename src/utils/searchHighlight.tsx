export const highlightText = (text: string, searchQuery: string) => {
  if (!searchQuery) return text;

  const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));

  return (
    <>
      {parts.map((part, index) => 
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};