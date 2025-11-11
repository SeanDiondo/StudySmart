import { db } from "./db";
import { subjects } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const defaultSubjects = [
  { name: "Introduction to Computing", code: "CSC 101" },
  { name: "Discrete Mathematics", code: "CSC 102" },
  { name: "Computer Programming 1", code: "CSC 103" },
  { name: "Computer Programming 2", code: "CSC 104" },
  { name: "Data Structures and Algorithms", code: "CSC 201" },
  { name: "Object-Oriented Programming", code: "CSC 202" },
  { name: "Database Systems", code: "CSC 203" },
  { name: "Computer Networks", code: "CSC 204" },
  { name: "Operating Systems", code: "CSC 301" },
  { name: "Software Engineering", code: "CSC 302" },
  { name: "Web Development", code: "CSC 303" },
  { name: "Mobile Application Development", code: "CSC 304" },
  { name: "Artificial Intelligence", code: "CSC 401" },
  { name: "Machine Learning", code: "CSC 402" },
  { name: "Cybersecurity Fundamentals", code: "CSC 403" },
  { name: "Cloud Computing", code: "CSC 404" },
  { name: "GEE 4 - Living the IT Eras", code: "GEE 4" },
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
        await db.insert(subjects).values({
          name: subject.name,
          description: `${subject.code} - ${subject.name}`,
          isDefault: true,
        });
        console.log(`⊳ Created default subject: ${subject.name}`);
      }
    }
    
    console.log("⊳ Default subjects seeding completed");
  } catch (error) {
    console.error("Error seeding default subjects:", error);
  }
}
