import { describe, expect, it } from "vitest";
import { parseContributions } from "@/lib/contrib";

const td = (date: string, level: number) =>
  `<td tabindex="0" data-ix="0" aria-selected="false" data-date="${date}" id="contribution-day-component-0-0" data-level="${level}" class="ContributionCalendar-day"></td>`;

describe("parseContributions", () => {
  it("groups days into Sunday-first weeks in date order", () => {
    // 2026-10-04 = Minggu
    const html = [td("2026-10-06", 2), td("2026-10-04", 1), td("2026-10-05", 0), td("2026-10-10", 4), td("2026-10-11", 3), td("2026-10-07", 0), td("2026-10-08", 1), td("2026-10-09", 0)].join("\n");
    const weeks = parseContributions(html)!;
    expect(weeks).toHaveLength(2);
    expect(weeks[0]).toEqual([1, 0, 2, 0, 1, 0, 4]);
    expect(weeks[1]).toEqual([3, -1, -1, -1, -1, -1, -1]);
  });

  it("returns null for unexpected markup", () => {
    expect(parseContributions("<html>rate limited</html>")).toBeNull();
    expect(parseContributions("")).toBeNull();
  });
});
