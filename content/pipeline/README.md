# Question bank v2 pipeline

Scripts that turned `Culturdle_Question_Bank_v1_full.xlsx` into the trimmed v2 bank.

1. `s5_score.py`: scores every row from public signals (IMDb votes and rating, Wikidata sitelinks, Billboard Hot 100, Bollywood song datasets) and applies the theatrical-only exclusions.
2. `s6_hints.py`: rebuilds the hint ladders so each step carries more information (target: 75–90% of players solve).
3. `s7_build.py`: calibrates the scores per pool so 6.0 is the keep line, then dedupes and re-buckets difficulty (45/35/20).
4. `s8_write.py`: writes the workbook (README, Scoring, Movies, Music, Icons, Removed, Sources).

The raw datasets (IMDb TSVs, Wikidata pulls, Billboard CSVs) are large and not committed; see the workbook's Sources tab.
