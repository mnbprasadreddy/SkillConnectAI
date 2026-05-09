/**
 * Centralized utility to normalize API payloads.
 * Ensures consistent extraction of data arrays or objects regardless of axios/backend nesting.
 * 
 * @param {any} response The raw or partially unwrapped response from the API
 * @param {string} expectedType 'array' or 'object'
 * @param {string} specificKey Optional key to look for (e.g., 'stats', 'problems', 'contests')
 * @returns {any} The normalized payload
 */
export const normalizeApiPayload = (response, expectedType = 'object', specificKey = null) => {
  if (!response) return expectedType === 'array' ? [] : null;

  let candidate = response;

  if (expectedType === 'array') {
    if (Array.isArray(candidate)) return candidate;
    if (candidate?.data && Array.isArray(candidate.data)) return candidate.data;
    if (candidate?.data?.data && Array.isArray(candidate.data.data)) return candidate.data.data;
    
    if (specificKey) {
      if (candidate?.[specificKey] && Array.isArray(candidate[specificKey])) return candidate[specificKey];
      if (candidate?.data?.[specificKey] && Array.isArray(candidate.data[specificKey])) return candidate.data[specificKey];
      if (candidate?.data?.data?.[specificKey] && Array.isArray(candidate.data.data[specificKey])) return candidate.data.data[specificKey];
    }
    
    return [];
  }

  // expectedType === 'object'
  if (specificKey) {
    if (candidate?.[specificKey]) return candidate;
    if (candidate?.data?.[specificKey]) return candidate.data;
    if (candidate?.data?.data?.[specificKey]) return candidate.data.data;
  } else {
    // If we just want a generic object, try to unwrap one level of .data if the root has it
    // But be careful not to unwrap if the data itself is the target
    if (candidate?.data && !Array.isArray(candidate.data) && typeof candidate.data === 'object') {
      // It might be nested
      if (candidate.data.data && typeof candidate.data.data === 'object') {
        return candidate.data.data;
      }
      return candidate.data;
    }
  }

  return candidate;
};
