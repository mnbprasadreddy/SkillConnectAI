const analyticsService = require('./src/services/analyticsService');

async function main() {
  const data = await analyticsService.getDashboardOverview(19);
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
