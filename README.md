# Hospital Injury Data Visualisation

An in-progress data visualisation project by Gloria, Manda, and Yathu.

## Project status

This repository contains the initial website draft. The team still needs to confirm the research question, dataset source, date range, and measures before adding findings or charts.

## Team and first tasks

| Team member | Role / first task |
| --- | --- |
| Gloria | Project Manager; maintain the project plan and draft the site structure and introduction |
| Manda | Inspect the dataset, document its source and fields, and prepare the data for analysis |
| Yathu | Propose suitable visualisations with the team and build the first agreed chart |

## Project structure

- `index.html` - project page and dashboard draft
- `css/` - page and chart styles
- `js/` - CSV loading and visualisation code
- `data/` - project dataset and its documentation

## Run locally

The page loads its CSV with `fetch`, so open the project through a local web server (for example, VS Code Live Server or XAMPP), not by opening `index.html` as a `file://` URL. The expected draft data path is `data/injuries.csv`.

## Before analysis

Add the dataset source and licence/usage notes to `data/README.md`. Agree as a team on the research question, date range, unit of analysis, and which columns represent counts or categories. Do not present placeholder values as findings.

## Git workflow

After the initial repository setup, work on individual feature branches and open pull requests into `main` for review. Pull the latest `main` before starting each task.

