export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=30');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const [gamesResponse, teamsResponse] = await Promise.all([
      fetch('https://worldcup26.ir/get/games'),
      fetch('https://worldcup26.ir/get/teams'),
    ]);

    if (!gamesResponse.ok || !teamsResponse.ok) {
      throw new Error('World Cup feed unavailable');
    }

    const [gamesData, teamsData] = await Promise.all([
      gamesResponse.json(),
      teamsResponse.json(),
    ]);

    res.status(200).json({
      source: 'worldcup26.ir',
      updatedAt: new Date().toISOString(),
      games: gamesData.games || [],
      teams: teamsData.teams || [],
    });
  } catch (error) {
    res.status(502).json({
      source: 'worldcup26.ir',
      error: 'Could not read live scores just now',
    });
  }
}
