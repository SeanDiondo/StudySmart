import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
async function getUncachableResendClient() {
  const { apiKey } = await getCredentials();
  // Override with custom email address for CCIT Study Plan
  const fromEmail = 'noreply@ccitstudy.live';
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail
  };
}

export interface StudyReminderData {
  recipientEmail: string;
  recipientName: string;
  subjectName: string;
  subjectCode?: string;
  yearLevel: string;
  day: string;
  startTime: string;
  endTime: string;
  minutesUntilStart: number;
}

export async function sendStudyReminder(data: StudyReminderData) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    // Calculate duration
    const [startHour, startMin] = data.startTime.split(':').map(Number);
    const [endHour, endMin] = data.endTime.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    const durationHours = Math.floor(durationMinutes / 60);
    const remainingMinutes = durationMinutes % 60;
    
    let durationText = '';
    if (durationHours > 0 && remainingMinutes > 0) {
      durationText = `${durationHours}h ${remainingMinutes}m`;
    } else if (durationHours > 0) {
      durationText = `${durationHours} hour${durationHours !== 1 ? 's' : ''}`;
    } else {
      durationText = `${remainingMinutes} minutes`;
    }
    
    // Format time display
    const formatTime = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return `${displayHour}:${String(m).padStart(2, '0')} ${period}`;
    };
    
    const urgencyText = data.minutesUntilStart === 15 
      ? "Your study session is starting in 15 minutes"
      : "Your study session is starting in 5 minutes";
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .alert {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin-bottom: 20px;
              border-radius: 4px;
            }
            .alert-title {
              font-weight: bold;
              color: #92400e;
              margin-bottom: 5px;
            }
            .detail-section {
              background-color: #f9fafb;
              border-radius: 6px;
              padding: 20px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 600;
              color: #6b7280;
            }
            .detail-value {
              color: #111827;
              font-weight: 500;
            }
            .subject-highlight {
              font-size: 20px;
              color: #2563eb;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">📚 CCIT Study Plan</div>
              <p style="color: #6b7280; margin: 0;">Your Personalized Learning Assistant</p>
            </div>
            
            <div class="alert">
              <div class="alert-title">⏰ Reminder</div>
              <div>${urgencyText}!</div>
            </div>
            
            <h2 style="color: #111827; margin-bottom: 20px;">Hello ${data.recipientName},</h2>
            
            <p style="margin-bottom: 20px;">
              It's time to prepare for your upcoming study session. Here are the details:
            </p>
            
            <div class="detail-section">
              <div class="detail-row">
                <span class="detail-label">Subject:</span>
                <span class="subject-highlight">${data.subjectName}${data.subjectCode ? ` (${data.subjectCode})` : ''}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Year Level:</span>
                <span class="detail-value">Year ${data.yearLevel}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Day:</span>
                <span class="detail-value">${data.day.charAt(0).toUpperCase() + data.day.slice(1)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${formatTime(data.startTime)} - ${formatTime(data.endTime)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${durationText}</span>
              </div>
            </div>
            
            <p style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-radius: 6px; border-left: 4px solid #2563eb;">
              <strong>💡 Study Tip:</strong> Gather your materials, find a quiet space, and eliminate distractions for maximum productivity!
            </p>
            
            <div class="footer">
              <p>This is an automated reminder from CCIT Study Plan</p>
              <p style="margin-top: 5px;">Keep up the great work! 🎯</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const textContent = `
CCIT Study Plan - Study Session Reminder

${urgencyText}!

Hello ${data.recipientName},

It's time to prepare for your upcoming study session. Here are the details:

Subject: ${data.subjectName}${data.subjectCode ? ` (${data.subjectCode})` : ''}
Year Level: Year ${data.yearLevel}
Day: ${data.day.charAt(0).toUpperCase() + data.day.slice(1)}
Time: ${formatTime(data.startTime)} - ${formatTime(data.endTime)}
Duration: ${durationText}

Study Tip: Gather your materials, find a quiet space, and eliminate distractions for maximum productivity!

This is an automated reminder from CCIT Study Plan.
Keep up the great work!
    `.trim();
    
    console.log(`📧 Attempting to send email from ${fromEmail} to ${data.recipientEmail}`);
    
    const result = await client.emails.send({
      from: fromEmail,
      to: data.recipientEmail,
      subject: `📚 Study Reminder: ${data.subjectName} in ${data.minutesUntilStart} minutes`,
      html: htmlContent,
      text: textContent,
    });
    
    // Check for Resend API errors
    if (result.error) {
      console.error('❌ Resend API error:', JSON.stringify(result.error));
      throw new Error(`Resend error: ${result.error.message || JSON.stringify(result.error)}`);
    }
    
    console.log(`✓ Study reminder sent successfully! Email ID:`, result.data?.id);
    console.log(`✓ Study reminder sent to ${data.recipientEmail} for ${data.subjectName} (${data.minutesUntilStart}min)`);
    return result;
  } catch (error: any) {
    console.error('❌ Error sending study reminder:', error);
    console.error('Error details:', error.message, error.stack);
    throw error;
  }
}
