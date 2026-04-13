const DB_NAME = 'video-annotator'
const DB_VERSION = 1
const STORE = 'videos'
export const SESSION_KEY_STORAGE = 'videoAnnotatorSessionKey'
const DATA_PREFIX = 'video-annotator:data:'

export function getVideoSessionKey(file) {
  if (!file) return ''
  return `${file.name}|${file.size}|${file.lastModified}`
}

export function loadPersistedData(key) {
  if (!key || typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(`${DATA_PREFIX}${key}`)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return null
    return {
      annotations: Array.isArray(data.annotations) ? data.annotations : [],
      labels: Array.isArray(data.labels) ? data.labels : [],
    }
  } catch {
    return null
  }
}

export function savePersistedData(key, annotations, labels) {
  if (!key || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(
      `${DATA_PREFIX}${key}`,
      JSON.stringify({ version: 1, annotations, labels }),
    )
  } catch (e) {
    console.warn('Failed to save annotations to local storage', e)
  }
}

export function clearPersistedData(key) {
  if (!key || typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(`${DATA_PREFIX}${key}`)
  } catch (e) {
    console.warn('Failed to clear annotations from local storage', e)
  }
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveVideoBlob(key, file) {
  if (!key || !file) return
  try {
    const db = await openDb()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(file, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.warn('Failed to cache video in IndexedDB', e)
  }
}

export async function loadVideoBlob(key) {
  if (!key) return null
  try {
    const db = await openDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(key)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch (e) {
    console.warn('Failed to load cached video from IndexedDB', e)
    return null
  }
}

export async function deleteVideoBlob(key) {
  if (!key) return
  try {
    const db = await openDb()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.warn('Failed to delete cached video from IndexedDB', e)
  }
}
