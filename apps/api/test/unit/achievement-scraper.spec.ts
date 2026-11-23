import {
  normalizeAchievementName,
  parseAchievementsFromProfileHtml,
} from '../../src/modules/github/achievement-scraper';

describe('GitHub public achievement HTML parser', () => {
  it('parses sidebar badges, deduplicates mobile duplicates, and preserves tiers', () => {
    const html = `
      <div class="achievement-badge-sidebar">
        <a href="/octocat?achievement=pull-shark&amp;tab=achievements">
          <img src="https://github.githubassets.com/assets/pull-shark-bronze.png"
            data-hovercard-type="achievement" alt="Achievement: Pull Shark" />
          <span class="achievement-tier-label--bronze">x2</span>
        </a>
        <a href="/octocat?achievement=pull-shark&amp;tab=achievements">
          <img src="https://github.githubassets.com/assets/pull-shark-bronze.png"
            data-hovercard-type="achievement" alt="Achievement: Pull Shark" />
        </a>
      </div>`;

    const result = parseAchievementsFromProfileHtml(html);
    expect(result.layoutDetected).toBe(true);
    expect(result.reason).toBeUndefined();
    expect(result.achievements).toEqual([
      {
        slug: 'pull-shark',
        name: 'Pull Shark',
        imageUrl: 'https://github.githubassets.com/assets/pull-shark-bronze.png',
        tier: 'BRONZE',
      },
    ]);
  });

  it('parses achievements page cards without hovercard attributes', () => {
    const html = `
      <div>
        <details data-achievement-slug="pair-extraordinaire">
          <summary><img src="https://github.githubassets.com/assets/pair-extraordinaire-silver.png"
            width="90" alt="Achievement: Pair Extraordinaire" />
            <span class="achievement-tier-label--silver">x3</span>
          </summary>
        </details>
      </div>`;
    expect(parseAchievementsFromProfileHtml(html).achievements[0]).toMatchObject({
      slug: 'pair-extraordinaire',
      name: 'Pair Extraordinaire',
      tier: 'SILVER',
    });
  });

  it('rejects untrusted image hosts and reports layout changes', () => {
    const result = parseAchievementsFromProfileHtml(
      '<a href="/u?achievement=evil"><img data-hovercard-type="achievement" src="https://evil.test/badge.png" alt="Achievement: Evil" /></a>',
    );
    expect(result.achievements).toEqual([]);
    expect(result.layoutDetected).toBe(true);
    expect(parseAchievementsFromProfileHtml('<html>changed</html>').reason).toBe('layout-changed');
  });

  it('normalizes names for catalog matching', () => {
    expect(normalizeAchievementName('Pair Extraordinaire')).toBe('pair-extraordinaire');
    expect(normalizeAchievementName('YOLO!')).toBe('yolo');
  });
});
