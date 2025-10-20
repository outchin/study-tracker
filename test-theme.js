// Run this in browser console to set today's theme directly
const today = new Date().toISOString().split('T')[0];
const scheduleKey = `schedule-${today}`;

// Get existing schedule or create basic one
let existingSchedule = localStorage.getItem(scheduleKey);
let scheduleData;

if (existingSchedule) {
  try {
    scheduleData = JSON.parse(existingSchedule);
    // Handle both old format (just blocks) and new format (full schedule)
    if (Array.isArray(scheduleData)) {
      scheduleData = {
        blocks: scheduleData,
        dayTheme: "🇯🇵 Japanese Marathon Power"
      };
    } else {
      scheduleData.dayTheme = "🇯🇵 Japanese Marathon Power";
    }
  } catch (e) {
    console.error('Error parsing existing schedule:', e);
    scheduleData = { blocks: [], dayTheme: "🇯🇵 Japanese Marathon Power" };
  }
} else {
  scheduleData = { blocks: [], dayTheme: "🇯🇵 Japanese Marathon Power" };
}

// Save back to localStorage
localStorage.setItem(scheduleKey, JSON.stringify(scheduleData));
console.log('Theme set for today:', today);
console.log('Refresh the page to see the change');