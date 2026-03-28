const STORAGE_KEY = 'BLOG:post-related-slide'

export function markPostRelatedNavigation(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
  }
}

export function isPostRelatedSlidePending(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function clearPostRelatedNavigationFlag(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
  }
}
