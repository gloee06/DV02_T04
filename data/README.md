# Data files

## Question 2: sex comparison

`q2_gender_comparison.csv` contains annual non-fatal hospitalised road traffic injury counts by year, sex, and jurisdiction.

## Question 4: age comparison

`q4_age_jurisdiction_annual.csv` contains one row per year, age group, and jurisdiction for 2011–2021.

| Column | Meaning |
| --- | --- |
| `year` | Calendar year |
| `age_group` | Source age band |
| `jurisdiction` | Australian state or territory abbreviation |
| `annual_cases` | Annual sum of the Jan–Jun and Jul–Dec counts; blank if either half-year is unpublished |
| `missing_periods` | Number of half-year counts marked `n.p.` (0–2) |
| `data_status` | `complete` when both half-years are numeric; otherwise `incomplete` |

### Question 4 processing and missing data

The source is the supplied `state-and-territory-hospitalisation-injury-publication-2023.xlsx`, `raw` sheet, columns X:AD. The KNIME flow reads rows 2–1373, keeps rows where `cause of injury = traffic` is `Traffic`, converts the cases column to numeric, and groups by calendar year, age group, and state or territory. The GroupBy sums the available half-year values and counts missing case values. The chart-ready CSV applies a final completeness rule: `annual_cases` is populated only when both half-year entries are numeric. If a half-year is unpublished, the annual value is blank even if the other half-year has a count. This avoids presenting a partial sum as a full annual count.

The source workbook defines `n.p.` as “not for publication” when small numbers are withheld due to confidentiality or data quality concerns. It is not zero. The Q4 export therefore leaves `annual_cases` blank if either half-year is `n.p.`. It contains 616 year-age-jurisdiction combinations: 558 complete and 58 incomplete. The 58 incomplete rows have 36 groups with one unpublished half-year and 22 groups with both half-years unpublished.

For the 2011–2021 change comparison, compare a group only when both endpoint years have numeric `annual_cases`. Keep incomplete values visible as unavailable. Do not impute them as zero or treat a partial sum as a full-year count.

These are absolute case counts, not population-adjusted rates. Label charts accordingly and avoid using counts alone to claim that one jurisdiction is safer or riskier.
