import { Filter } from 'bad-words';
import badWordsEs from 'bad-words-es';

// Inicializar filtros de inglés y español
const englishFilter = new Filter();
const spanishFilter = new Filter();

// Cargar diccionario español en el filtro (bad-words-es exporta un array directamente)
if (Array.isArray(badWordsEs)) {
  spanishFilter.addWords(...badWordsEs);
}

// Combinar ambos diccionarios en un solo filtro bilingüe
const bilingualFilter = new Filter();
bilingualFilter.addWords(...englishFilter.list);
if (Array.isArray(badWordsEs)) {
  bilingualFilter.addWords(...badWordsEs);
}

/**
 * Normaliza el texto para detectar intentos de evasión
 * - Elimina acentos
 * - Convierte a minúsculas
 * - Traduce leetspeak común
 */
function normalizeText(text: string): string {
  let normalized = text.toLowerCase();

  // Eliminar acentos
  normalized = normalized
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n');

  // Traducir leetspeak común
  normalized = normalized
    .replace(/3/g, 'e')
    .replace(/0/g, 'o')
    .replace(/@/g, 'a')
    .replace(/1/g, 'i')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/4/g, 'a')
    .replace(/\$/g, 's')
    .replace(/\*/g, '')
    .replace(/-/g, '')
    .replace(/_/g, '');

  return normalized;
}

/**
 * Verifica si el texto contiene groserías
 * @param texto - Texto a evaluar
 * @returns true si contiene groserías, false en caso contrario
 */
export function contieneGroserias(texto: string): boolean {
  if (!texto || typeof texto !== 'string') {
    return false;
  }

  const normalized = normalizeText(texto);
  return bilingualFilter.isProfane(normalized);
}

/**
 * Obtiene las groserías encontradas en el texto
 * @param texto - Texto a evaluar
 * @returns Array de groserías encontradas
 */
export function obtenerGroserias(texto: string): string[] {
  if (!texto || typeof texto !== 'string') {
    return [];
  }

  const normalized = normalizeText(texto);
  const words = normalized.split(/\s+/);
  const found: string[] = [];

  for (const word of words) {
    if (bilingualFilter.isProfane(word)) {
      found.push(word);
    }
  }

  return found;
}

/**
 * Limpia el texto reemplazando groserías con asteriscos
 * @param texto - Texto a limpiar
 * @returns Texto limpio con groserías censuradas
 */
export function limpiarTexto(texto: string): string {
  if (!texto || typeof texto !== 'string') {
    return texto;
  }

  const normalized = normalizeText(texto);
  const cleaned = bilingualFilter.clean(normalized);

  // Restaurar el formato original del texto (solo censurar las groserías)
  const words = texto.split(/\s+/);
  const cleanedWords = cleaned.split(/\s+/);
  
  return words.map((word, index) => {
    if (cleanedWords[index] && cleanedWords[index].includes('*')) {
      return '*'.repeat(word.length);
    }
    return word;
  }).join(' ');
}
