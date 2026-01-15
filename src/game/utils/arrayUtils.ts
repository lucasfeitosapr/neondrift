/**
 * Array utility functions for efficient mutations
 * 
 * These utilities provide O(1) removal operations using swap-and-pop
 * instead of O(n) splice operations.
 */

/**
 * Remove an element at index using swap-and-pop (O(1) operation)
 * Only use this when order doesn't matter, as it swaps the last element
 * into the removed position.
 * 
 * @param array - The array to modify
 * @param index - Index of element to remove
 * @returns true if element was removed, false if index is invalid
 */
export function removeAtSwap<T>(array: T[], index: number): boolean {
  if (index < 0 || index >= array.length) return false;
  
  // Swap last element to current position
  const lastIndex = array.length - 1;
  if (index !== lastIndex) {
    array[index] = array[lastIndex];
  }
  
  // Remove last element (now the swapped one)
  array.pop();
  return true;
}

/**
 * Remove multiple elements by indices using swap-and-pop
 * Indices should be sorted in descending order for efficiency
 * 
 * @param array - The array to modify
 * @param indices - Array of indices to remove (should be sorted descending)
 */
export function removeMultipleSwap<T>(array: T[], indices: number[]): void {
  // Sort indices descending to avoid index shifting issues
  const sortedIndices = [...indices].sort((a, b) => b - a);
  
  for (const index of sortedIndices) {
    removeAtSwap(array, index);
  }
}

/**
 * Remove elements matching a predicate using swap-and-pop
 * More efficient than filter when removing many elements
 * 
 * @param array - The array to modify
 * @param predicate - Function that returns true for elements to remove
 * @returns Number of elements removed
 */
export function removeIfSwap<T>(array: T[], predicate: (item: T, index: number) => boolean): number {
  let removedCount = 0;
  let writeIndex = 0;
  
  // Single pass: keep elements that don't match predicate
  for (let readIndex = 0; readIndex < array.length; readIndex++) {
    if (!predicate(array[readIndex], readIndex)) {
      if (writeIndex !== readIndex) {
        array[writeIndex] = array[readIndex];
      }
      writeIndex++;
    } else {
      removedCount++;
    }
  }
  
  // Trim array to new length
  array.length = writeIndex;
  return removedCount;
}
