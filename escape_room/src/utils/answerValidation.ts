const FINAL_FORMS: Record<string, string> = {
  ך: 'כ',
  ם: 'מ',
  ן: 'נ',
  ף: 'פ',
  ץ: 'צ',
};

function normalizeHebrew(text: string): string {
  return text
    .split('')
    .map((ch) => FINAL_FORMS[ch] ?? ch)
    .join('');
}

/** Trim, lowercase (English), collapse spaces, normalize Hebrew finals */
export function normalizeAnswer(text: string): string {
  return normalizeHebrew(text.trim().toLocaleLowerCase('en-US')).replace(/\s+/g, ' ');
}

function partsMatch(userInput: string, accepted: string): boolean {
  const userParts = userInput.split(/[,،\s]+/).filter(Boolean);
  const answerParts = accepted.split(/[,،\s]+/).filter(Boolean);

  if (answerParts.length <= 1) {
    return false;
  }

  if (userParts.length !== answerParts.length) {
    return false;
  }

  return userParts.every((part, i) => part === answerParts[i]);
}

export function isAnswerCorrect(
  userInput: string,
  acceptedAnswers: string[],
  acceptAny = false,
): boolean {
  if (acceptAny && userInput.trim().length > 0) {
    return true;
  }

  const normalized = normalizeAnswer(userInput);
  if (!normalized) {
    return false;
  }

  return acceptedAnswers.some((answer) => {
    const normalizedAnswer = normalizeAnswer(answer);

    if (normalized === normalizedAnswer) {
      return true;
    }

    return partsMatch(normalized, normalizedAnswer);
  });
}
