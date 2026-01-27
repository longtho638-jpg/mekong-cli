# Frequently Asked Questions (FAQ) ❓

### Q: How do I get the "Coming Soon" products?
**A:** When these products are released, you will receive an email notification from the platform where you purchased the bundle (Gumroad). You will be able to download the updated ZIP file at no extra cost.

### Q: Can I use these products in multiple projects?
**A:** Yes! The license allows you to use these kits in unlimited personal and commercial projects. However, you cannot resell the kits themselves as standalone products or open-source them entirely.

### Q: I'm getting an error installing dependencies.
**A:** Ensure you are using a recent version of Node.js (v18+). If you run into conflicts, try deleting `node_modules` and `package-lock.json` and running `npm install` again.

### Q: Do I need Docker?
**A:** Docker is not strictly required for the Node.js apps themselves, but it is highly recommended for running the databases (Postgres, Redis) that these apps depend on. The `setup/docker-compose.yml` file makes this very easy.

### Q: Can I refund the bundle?
**A:** We offer a 14-day money-back guarantee if you are not satisfied with the product. Please contact support.

### Q: How do I update a specific kit?
**A:** If we release a patch for a specific kit, you can simply replace the folder in `products/` with the new version from the updated bundle ZIP.

### Q: Are these kits TypeScript or JavaScript?
**A:** Most kits are written in TypeScript for type safety and better developer experience, but they compile to standard JavaScript.
