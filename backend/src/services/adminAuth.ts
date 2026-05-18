import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { signAdminToken } from "../lib/auth.js";

export async function loginAdmin(email: string, password: string) {
  const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!admin) return null;

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return null;

  const token = signAdminToken({ adminId: admin.id, email: admin.email });

  return {
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    },
  };
}

export async function getAdminById(adminId: string) {
  return prisma.admin.findUnique({
    where: { id: adminId },
    select: { id: true, email: true, name: true, createdAt: true },
  });
}

export async function seedAdminUser() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@jewelry.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.admin.upsert({
    where: { email },
    create: { email, passwordHash, name: "Store Admin" },
    update: { passwordHash, name: "Store Admin" },
  });
}
