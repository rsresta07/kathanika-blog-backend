export default function generatePassword(slug, contact) {
  if (!slug || !contact || contact.length < 4) {
    throw new Error("Invalid slug or contact");
  }

  const firstName = slug.split(" ")[0];
  const capitalLetter = firstName.charAt(0).toUpperCase();
  const otherLetters = firstName.split(" ")[0].slice(1);

  const lastFourDigits = contact.slice(-4);

  return `@${capitalLetter}${otherLetters}${lastFourDigits}`;
}
