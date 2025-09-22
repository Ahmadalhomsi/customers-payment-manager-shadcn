/**
 * Turkish character normalization utilities
 */

/**
 * Normalize Turkish characters for search
 * Converts Turkish characters to their ASCII equivalents for better search compatibility
 */
export function normalizeTurkish(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    // Turkish character mappings
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/İ/g, 'i')
    .replace(/Ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/Ş/g, 's')
    .replace(/Ö/g, 'o')
    .replace(/Ç/g, 'c');
}

/**
 * Create search conditions that work with both original and normalized Turkish text
 * This creates OR conditions to match both the original text and normalized versions
 */
export function createTurkishSearchConditions(searchTerm, fields) {
  if (!searchTerm || !fields || fields.length === 0) return [];
  
  const normalizedSearch = normalizeTurkish(searchTerm);
  const conditions = [];
  
  fields.forEach(field => {
    // Add condition for original search term (case insensitive)
    conditions.push({
      [field]: { contains: searchTerm, mode: 'insensitive' }
    });
    
    // If normalized version is different, add condition for normalized search
    if (normalizedSearch !== searchTerm.toLowerCase()) {
      conditions.push({
        [field]: { contains: normalizedSearch, mode: 'insensitive' }
      });
    }
  });
  
  return conditions;
}

/**
 * Create nested field search conditions for relations (like customer.name)
 */
export function createTurkishNestedSearchConditions(searchTerm, nestedFieldPath) {
  if (!searchTerm || !nestedFieldPath) return [];
  
  const normalizedSearch = normalizeTurkish(searchTerm);
  const conditions = [];
  
  // Split nested path (e.g., "customer.name" -> ["customer", "name"])
  const pathParts = nestedFieldPath.split('.');
  
  if (pathParts.length === 2) {
    const [relation, field] = pathParts;
    
    // Add condition for original search term
    conditions.push({
      [relation]: {
        [field]: { contains: searchTerm, mode: 'insensitive' }
      }
    });
    
    // If normalized version is different, add condition for normalized search
    if (normalizedSearch !== searchTerm.toLowerCase()) {
      conditions.push({
        [relation]: {
          [field]: { contains: normalizedSearch, mode: 'insensitive' }
        }
      });
    }
  }
  
  return conditions;
}