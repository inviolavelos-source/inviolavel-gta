import { getDb } from "./server/db";
import { funcionarios } from "./drizzle/schema";
import bcrypt from "bcryptjs";

async function runSeed() {
    const db = await getDb();
    if (!db) {
        throw new Error("Cannot get DB");
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("123456", salt);

    await db.insert(funcionarios).values({
        nome: "Administrador",
        email: "admin@inviolavelgta.com",
        senhaHash: hash,
        perfil: "ADMIN",
    });

    console.log("Admin user seeded successfully!");
    process.exit(0);
}

runSeed().catch((err) => {
    console.error("Error seeding DB:", err);
    process.exit(1);
});
