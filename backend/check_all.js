const analyticsService = require('./src/services/analyticsService');
const recommendationService = require('./src/services/recommendationService');

async function main() {
  const userId = 19; // Sashank
  console.log("Fetching dash...");
  try {
    await analyticsService.getDashboardOverview(userId);
    console.log("Dash success.");
  } catch(e) { console.error("Dash error:", e); }

  console.log("Fetching recs...");
  try {
    await recommendationService.getRecommendations(userId);
    console.log("Recs success.");
  } catch(e) { console.error("Recs error:", e); }

  console.log("Fetching coding stats...");
  try {
    await analyticsService.getCodingStats(userId);
    console.log("Coding success.");
  } catch(e) { console.error("Coding error:", e); }
}

main().catch(console.error).finally(() => process.exit(0));
