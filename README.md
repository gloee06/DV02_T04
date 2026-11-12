# Hospital Injury Data Visualisation

An in-progress data visualisation project by Gloria, Manda, and Yathu.

## Project status

The website is organised as a five-question data story. Questions 2 and 4 currently have interactive charts; Questions 1, 3, and 5 are storyboard sections awaiting their processed data and agreed visualisations. Review findings with the team before presenting them.

## Team and first tasks

| Team member | Role / first task |
| --- | --- |
| Gloria | Project Manager; maintain the project plan and draft the site structure and introduction |
| Manda | Inspect the dataset, document its source and fields, and prepare the data for analysis |
| Yathu | Propose suitable visualisations with the team and build the first agreed chart |

## Project structure

- `index.html` - five-question story structure, chart sections, and source notes
- `css/` - shared page styles and question-specific chart styles
- `js/` - CSV loading and visualisation code
- `data/` - processed CSV files and their documentation

## Run locally

The page loads CSV files with `fetch`, so open the project through a local web server (for example, VS Code Live Server or XAMPP), not by opening `index.html` as a `file://` URL. Questions 2 and 4 read `data/q2_gender_comparison.csv` and `data/q4_age_jurisdiction_annual.csv` respectively.

## Before analysis

Review the source, processing, and missing-data notes in `data/README.md`. In the Q4 CSV, a blank `annual_cases` value means at least one half-year count was not published. Treat it as unavailable, not zero. Compare 2011 with 2021 only where both values are available. These are counts, not population-adjusted rates.

## Git workflow

After the initial repository setup, work on individual feature branches and open pull requests into `main` for review. Pull the latest `main` before starting each task.

