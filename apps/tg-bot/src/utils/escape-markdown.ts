export const escapeMarkdownV2 = (text: string) => {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
};
