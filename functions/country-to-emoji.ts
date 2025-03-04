export const countryToEmoji = (country: string): string => {
  const code = country
    .toUpperCase()
    .slice(0, 2)
    .split('')
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');

  return code;
};
