# SQLAlchemy Model Standards

Guidelines for defining database models using SQLAlchemy.

## Rules
- Use the Declarative Base for model definitions.
- Define explicit table names using `__tablename__`.
- Use type-annotated columns (e.g., `Mapped[int]`).
- Define relationships clearly with `relationship()` and specify `back_populates`.
- Use indexes on columns that are frequently used in filters or joins.
- Avoid `dynamic` loaders unless necessary for large collections.
- Keep models focused on data structure; move business logic to services.
