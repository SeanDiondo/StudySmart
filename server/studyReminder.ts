import { storage } from "./storage";
import { sendStudyReminder } from "./email";

// Track sent reminders to avoid duplicates (in-memory for simplicity)
// Format: "userId-subjectId-day-startTime-minutesUntil"
const sentReminders = new Set<string>();

// Clean up old reminders every hour (keep only last 2 hours)
setInterval(() => {
  sentReminders.clear();
  console.log('🧹 Cleared sent reminders cache');
}, 2 * 60 * 60 * 1000); // 2 hours

function getCurrentDayAndTime(): { day: string; currentMinutes: number } {
  const now = new Date();
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const day = daysOfWeek[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  return { day, currentMinutes };
}

function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

export async function checkAndSendStudyReminders() {
  try {
    const { day, currentMinutes } = getCurrentDayAndTime();
    
    // Get all active study plans
    const studyPlans = await storage.getAllActiveStudyPlans();
    
    for (const studyPlan of studyPlans) {
      // Get the user details
      const user = await storage.getUser(studyPlan.userId);
      if (!user || !user.email) {
        continue;
      }
      
      // Get subjects associated with this study plan
      const planSubjects = await storage.getStudyPlanSubjects(studyPlan.id);
      
      // Check each time slot for today
      const todaySlots = studyPlan.availableTimeSlots.filter(
        (slot: { day: string; startTime: string; endTime: string }) => slot.day.toLowerCase() === day.toLowerCase()
      );
      
      for (const slot of todaySlots) {
        const slotStartMinutes = timeToMinutes(slot.startTime);
        const minutesUntilStart = slotStartMinutes - currentMinutes;
        
        // Check if we should send 15-minute or 5-minute reminder
        if (minutesUntilStart === 15 || minutesUntilStart === 5) {
          // Send reminder for each subject in the study plan
          for (const planSubject of planSubjects) {
            const subject = await storage.getSubject(planSubject.subjectId);
            if (!subject) continue;
            
            const reminderKey = `${user.id}-${subject.id}-${day}-${slot.startTime}-${minutesUntilStart}`;
            
            // Check if we already sent this reminder
            if (sentReminders.has(reminderKey)) {
              continue;
            }
            
            // Send the reminder
            try {
              await sendStudyReminder({
                recipientEmail: user.email,
                recipientName: user.firstName || 'Student',
                subjectName: subject.name,
                subjectCode: subject.description?.match(/\((.*?)\)/)?.[1], // Extract code from description
                yearLevel: subject.yearLevel || '1',
                day: slot.day,
                startTime: slot.startTime,
                endTime: slot.endTime,
                minutesUntilStart,
              });
              
              // Mark as sent
              sentReminders.add(reminderKey);
            } catch (error) {
              console.error(`Error sending reminder for ${subject.name}:`, error);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in study reminder check:', error);
  }
}

// Start the scheduler - check every minute
export function startStudyReminderScheduler() {
  console.log('📧 Study reminder scheduler started');
  
  // Check immediately on startup
  checkAndSendStudyReminders();
  
  // Then check every minute
  setInterval(checkAndSendStudyReminders, 60 * 1000);
}
