export class FhevmError extends Error {
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = "FhevmError";
    this.code = code;
    this.details = details;
  }
}

export function parseFhevmError(error: any): FhevmError {
  if (error instanceof FhevmError) {
    return error;
  }

  const message = error?.message || String(error);

  // Parse common error patterns
  if (message.includes("user rejected")) {
    return new FhevmError("Transaction was rejected by user", "USER_REJECTED", error);
  }

  if (message.includes("insufficient funds")) {
    return new FhevmError("Insufficient funds for transaction", "INSUFFICIENT_FUNDS", error);
  }

  if (message.includes("nonce")) {
    return new FhevmError("Invalid transaction nonce", "INVALID_NONCE", error);
  }

  if (message.includes("gas")) {
    return new FhevmError("Gas estimation failed or insufficient gas", "GAS_ERROR", error);
  }

  if (message.includes("revert")) {
    return new FhevmError("Transaction reverted", "TRANSACTION_REVERTED", error);
  }

  if (message.includes("network") || message.includes("timeout")) {
    return new FhevmError("Network error occurred", "NETWORK_ERROR", error);
  }

  if (message.includes("signature")) {
    return new FhevmError("Failed to create or verify signature", "SIGNATURE_ERROR", error);
  }

  if (message.includes("decrypt")) {
    return new FhevmError("Decryption failed", "DECRYPTION_ERROR", error);
  }

  if (message.includes("encrypt")) {
    return new FhevmError("Encryption failed", "ENCRYPTION_ERROR", error);
  }

  return new FhevmError(message, "UNKNOWN_ERROR", error);
}

export function getUserFriendlyError(error: any): string {
  const fhevmError = parseFhevmError(error);

  switch (fhevmError.code) {
    case "USER_REJECTED":
      return "You rejected the transaction. Please try again if you want to proceed.";
    case "INSUFFICIENT_FUNDS":
      return "You don't have enough funds to complete this transaction.";
    case "INVALID_NONCE":
      return "Transaction nonce is invalid. Please try refreshing the page.";
    case "GAS_ERROR":
      return "There was an issue with gas estimation. Try increasing the gas limit.";
    case "TRANSACTION_REVERTED":
      return "The transaction was reverted by the contract. Check the transaction requirements.";
    case "NETWORK_ERROR":
      return "Network connection issue. Please check your connection and try again.";
    case "SIGNATURE_ERROR":
      return "Failed to sign the transaction. Please try again.";
    case "DECRYPTION_ERROR":
      return "Failed to decrypt the value. Make sure you have the correct permissions.";
    case "ENCRYPTION_ERROR":
      return "Failed to encrypt the value. Please try again.";
    default:
      return fhevmError.message;
  }
}
