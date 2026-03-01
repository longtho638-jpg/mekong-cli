// Detect Safari to disable GPU-heavy blur animations that crash WebKit's compositor
const isSafariBrowser =
  typeof navigator !== 'undefined' &&
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export function isSafari(): boolean {
  return isSafariBrowser;
}
