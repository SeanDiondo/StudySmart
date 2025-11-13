import bcrypt from "bcrypt";
import { storage } from "./storage";

export async function seedTestUsers() {
  const testUsers = [
    {
      email: "student@test.com",
      password: "Study123!",
      firstName: "Test",
      lastName: "Student",
      role: "student" as const,
    },
    {
      email: "admin@test.com",
      password: "Admin123!",
      firstName: "Test",
      lastName: "Admin",
      role: "admin" as const,
    },
    {
      email: "system@ccitstudy.local",
      password: "SystemGenerated123!",
      firstName: "AI",
      lastName: "System",
      role: "admin" as const,
    },
  ];

  for (const user of testUsers) {
    try {
      const existingUser = await storage.getUserByEmail(user.email);
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await storage.createTestUser({
          email: user.email,
          password: hashedPassword,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        });
        console.log(`✓ Created test user: ${user.email}`);
      } else {
        console.log(`⊳ Test user already exists: ${user.email}`);
      }
    } catch (error) {
      console.error(`✗ Error creating test user ${user.email}:`, error);
    }
  }
}
