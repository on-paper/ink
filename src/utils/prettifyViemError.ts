export function prettifyViemError(error: any): string {
  const errorMessage = error?.message || error?.toString() || "An unknown error occurred";
  
  if (errorMessage.includes("User rejected the request")) {
    return "Transaction cancelled";
  }
  
  if (errorMessage.includes("User denied transaction signature")) {
    return "Signature cancelled";
  }
  
  if (errorMessage.includes("insufficient funds")) {
    return "Insufficient funds for transaction";
  }
  
  if (errorMessage.includes("nonce too low")) {
    return "Transaction nonce conflict. Please try again";
  }
  
  if (errorMessage.includes("replacement transaction underpriced")) {
    return "Transaction fee too low. Please increase gas price";
  }
  
  if (errorMessage.includes("execution reverted")) {
    return "Transaction failed. Please check your inputs";
  }
  
  if (errorMessage.includes("Failed to fetch")) {
    return "Network error. Please check your connection";
  }
  
  if (errorMessage.includes("Invalid address")) {
    return "Invalid wallet address";
  }
  
  if (errorMessage.includes("Chain mismatch")) {
    return "Wrong network. Please switch networks";
  }
  
  const detailsMatch = errorMessage.match(/Details: (.+?)(?:\s+Version:|$)/);
  if (detailsMatch) {
    return detailsMatch[1];
  }
  
  const simpleMatch = errorMessage.match(/^([^.]+)/);
  if (simpleMatch) {
    return simpleMatch[1];
  }
  
  return "Transaction failed. Please try again";
}