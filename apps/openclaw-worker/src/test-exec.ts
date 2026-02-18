export function helloWorld(name: string): string {
  if (!name) {
    throw new Error('Name is required');
  }
  return `Hello, ${name}!`;
}
