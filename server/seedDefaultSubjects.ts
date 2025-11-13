import { db } from "./db";
import { subjects } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const defaultSubjects = [
  { name: "Introduction to Computing", code: "CSC 101", yearLevel: "1" as const },
  { name: "Discrete Mathematics", code: "CSC 102", yearLevel: "1" as const },
  { name: "Computer Programming 1", code: "CSC 103", yearLevel: "1" as const },
  { name: "Computer Programming 2", code: "CSC 104", yearLevel: "1" as const },
  { name: "Data Structures and Algorithms", code: "CSC 201", yearLevel: "2" as const },
  { name: "Object-Oriented Programming", code: "CSC 202", yearLevel: "2" as const },
  { name: "Database Systems", code: "CSC 203", yearLevel: "2" as const },
  { name: "Computer Networks", code: "CSC 204", yearLevel: "2" as const },
  { name: "Operating Systems", code: "CSC 301", yearLevel: "3" as const },
  { name: "Software Engineering", code: "CSC 302", yearLevel: "3" as const },
  { name: "Web Development", code: "CSC 303", yearLevel: "3" as const },
  { name: "Mobile Application Development", code: "CSC 304", yearLevel: "3" as const },
  { name: "Artificial Intelligence", code: "CSC 401", yearLevel: "4" as const },
  { name: "Machine Learning", code: "CSC 402", yearLevel: "4" as const },
  { name: "Cybersecurity Fundamentals", code: "CSC 403", yearLevel: "4" as const },
  { name: "Cloud Computing", code: "CSC 404", yearLevel: "4" as const },
  { name: "GEE 4 - Living the IT Eras", code: "GEE 4", yearLevel: "1" as const },
];

export async function seedDefaultSubjects() {
  try {
    console.log("⊳ Seeding default CCIT subjects...");
    
    for (const subject of defaultSubjects) {
      // Check if subject already exists
      const existing = await db
        .select()
        .from(subjects)
        .where(
          and(
            eq(subjects.name, subject.name),
            eq(subjects.isDefault, true)
          )
        );

      if (existing.length === 0) {
        // Insert new subject
        await db.insert(subjects).values({
          name: subject.name,
          description: `${subject.code} - ${subject.name}`,
          yearLevel: subject.yearLevel,
          isDefault: true,
        });
        console.log(`⊳ Created default subject: ${subject.name} (Year ${subject.yearLevel})`);
      } else {
        // Update existing subject to ensure yearLevel is set correctly
        await db
          .update(subjects)
          .set({ 
            yearLevel: subject.yearLevel,
            description: `${subject.code} - ${subject.name}`,
          })
          .where(eq(subjects.id, existing[0].id));
        console.log(`⊳ Updated default subject: ${subject.name} (Year ${subject.yearLevel})`);
      }
    }
    
    console.log("⊳ Default subjects seeding completed");
  } catch (error) {
    console.error("Error seeding default subjects:", error);
  }
}
