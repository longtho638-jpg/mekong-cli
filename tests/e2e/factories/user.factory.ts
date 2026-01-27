// Using a simple random generator instead of faker for zero-dep simplicity in this example,
// or assuming faker is available if needed. For now, simple factory.

export const UserFactory = {
  create: (overrides: Record<string, any> = {}) => {
    const id = Math.floor(Math.random() * 10000);
    return {
      id,
      email: `user${id}@example.com`,
      name: `User ${id}`,
      password: 'password123',
      role: 'user',
      ...overrides,
    };
  },

  createAdmin: (overrides: Record<string, any> = {}) => {
    return UserFactory.create({
      email: `admin${Math.floor(Math.random() * 10000)}@example.com`,
      role: 'admin',
      ...overrides,
    });
  }
};
