/**
 * Compares two objects and returns an object containing only the fields that have changed.
 *
 * @param {Object} initialData - The original data.
 * @param {Object} currentData - The updated data.
 * @returns {Object} An object with only the modified fields.
 */
export const getModifiedFields = (initialData, currentData) => {
  const modifiedFields = {}

  if (!initialData || !currentData) return currentData || {}

  Object.keys(currentData).forEach(key => {
    // Skip internal fields if necessary (like _id, createdAt, etc. depending on context)
    // but usually we want to compare everything that could be in a form.

    const initialValue = initialData[key]
    const currentValue = currentData[key]

    // Deep comparison for arrays/objects could be added if needed,
    // but for most flat forms, a simple equality check is enough.
    if (JSON.stringify(initialValue) !== JSON.stringify(currentValue)) {
      modifiedFields[key] = currentValue
    }
  })

  return modifiedFields
}

/**
 * Checks if two objects are equal.
 *
 * @param {Object} obj1
 * @param {Object} obj2
 * @returns {boolean}
 */
export const isDeepEqual = (obj1, obj2) => {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}
