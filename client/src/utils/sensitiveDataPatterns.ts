// client/src/utils/sensitiveDataPatterns.ts

/**
 * Validates a number using the Luhn algorithm.
 * Used for Credit Card validation.
 * @param value The number string to validate.
 * @returns True if valid, false otherwise.
 */
export function validateLuhn(value: string): boolean {
    // Remove any non-digit characters (spaces, dashes)
    const sanitized = value.replace(/\D/g, '');

    if (sanitized.length < 13 || sanitized.length > 19) {
        return false;
    }

    let sum = 0;
    let shouldDouble = false;

    // Loop through values starting from the rightmost digit
    for (let i = sanitized.length - 1; i >= 0; i--) {
        let digit = parseInt(sanitized.charAt(i));

        if (shouldDouble) {
            if ((digit *= 2) > 9) digit -= 9;
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
}

export const sensitiveDataPatterns = {
    // Credit Card Numbers (Visa, MasterCard, Amex, Discover, JCB, Diners Club)
    // Matches 13-19 digits, potentially separated by spaces or dashes
    creditCard: /((?:4\d{3}|5[1-5]\d{2}|6011|3[47]\d{2})[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}(?:[- ]?\d{1,3})?)/g,

    // US Social Security Numbers (XXX-XX-XXXX)
    ssn: /\b(?!000|666|9\d{2})([0-8]\d{2})-(?!00)(\d{2})-(?!0000)(\d{4})\b/g,

    // API Keys & Secrets
    awsAccessKey: /(?<![A-Z0-9])[A-Z0-9]{20}(?![A-Z0-9])/g, // AKIA...
    awsSecretKey: /(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])/g,
    githubToken: /gh[pousr]_[A-Za-z0-9_]{36,255}/g,
    googleApiKey: /AIza[0-9A-Za-z-_]{35}/g,
    stripeKey: /(?:sk|pk)_(?:test|live)_[0-9a-zA-Z]{24,}/g,

    // Private Keys
    privateKey: /-----BEGIN (?:RSA )?PRIVATE KEY-----/g,

    // Email Addresses (Simple regex, can be refined)
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
};
