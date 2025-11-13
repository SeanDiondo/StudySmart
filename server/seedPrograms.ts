import { db } from "./db";
import { programs, studyMaterials} from "@shared/schema";
import { eq } from "drizzle-orm";

const defaultPrograms = [
  { 
    code: "BSIT", 
    name: "Bachelor of Science in Information Technology",
    description: "A four-year degree program that focuses on information technology systems, software development, and digital infrastructure."
  },
  { 
    code: "BSCS", 
    name: "Bachelor of Science in Computer Science",
    description: "A four-year degree program emphasizing computer science theory, algorithms, and advanced computing concepts."
  },
];

export async function seedPrograms() {
  try {
    console.log("⊳ Seeding degree programs...");
    
    for (const program of defaultPrograms) {
      // Check if program already exists
      const existing = await db
        .select()
        .from(programs)
        .where(eq(programs.code, program.code));

      if (existing.length === 0) {
        // Insert new program
        await db.insert(programs).values({
          code: program.code,
          name: program.name,
          description: program.description,
          isActive: true,
        });
        console.log(`⊳ Created program: ${program.code} - ${program.name}`);
      } else {
        // Update existing program
        await db
          .update(programs)
          .set({ 
            name: program.name,
            description: program.description,
            isActive: true,
          })
          .where(eq(programs.id, existing[0].id));
        console.log(`⊳ Updated program: ${program.code} - ${program.name}`);
      }
    }
    
    // Migrate existing materials to have valid status
    console.log("⊳ Migrating existing study materials...");
    const materialsToMigrate = await db
      .select()
      .from(studyMaterials)
      .where(eq(studyMaterials.subjectValidationStatus, "pending"));
    
    if (materialsToMigrate.length > 0) {
      // Update all pending materials that have a subject to be valid
      const materialsWithSubject = materialsToMigrate.filter(m => m.subjectId !== null);
      
      for (const material of materialsWithSubject) {
        await db
          .update(studyMaterials)
          .set({ subjectValidationStatus: "valid" })
          .where(eq(studyMaterials.id, material.id));
      }
      
      console.log(`⊳ Migrated ${materialsWithSubject.length} existing materials to 'valid' status`);
    }
    
    console.log("⊳ Program seeding and migration completed");
  } catch (error) {
    console.error("Error seeding programs:", error);
  }
}
