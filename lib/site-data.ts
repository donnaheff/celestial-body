// Shared marketing content for the Services and Work pages.
// Ported from the design handoff's site-data.js — single edit point.

export interface ServiceItem {
  title: string;
  body?: string;
  kicker?: string;
}

export interface ServiceCategory {
  title: string;
  subtitle: string;
  items: ServiceItem[];
}

export const serviceCategories: ServiceCategory[] = [
  {
    title: "Care & support services",
    subtitle: "Tender writing across community-based care provision.",
    items: [
      { title: "Domiciliary care", body: "Home care" },
      { title: "Supported living" },
      { title: "Supported accommodation" },
      { title: "Semi-independent living" },
      { title: "Adult day care", body: "Day services" },
      { title: "Dementia services" },
      { title: "Wellbeing hubs" },
    ],
  },
  {
    title: "Children's services",
    subtitle: "Submissions covering children's social care and short breaks.",
    items: [
      { title: "Care for children" },
      { title: "Short breaks for children" },
      { title: "Children's homes" },
    ],
  },
  {
    title: "Residential & care homes",
    subtitle: "Bids and applications for registered residential provision.",
    items: [{ title: "Care homes" }, { title: "Residential homes" }],
  },
  {
    title: "Regulatory applications",
    subtitle: "Registration and variation submissions to CQC and Ofsted.",
    items: [
      { title: "CQC applications", body: "New registration" },
      { title: "CQC new location" },
      { title: "CQC new specialism", body: "Addition to existing registration" },
      { title: "Ofsted applications" },
    ],
  },
  {
    title: "Documentation & other tenders",
    subtitle: "Supporting documentation and adjacent facilities tenders.",
    items: [
      { title: "Policies & procedures", body: "Drafted to inspection standard" },
      { title: "Cleaning services tenders" },
    ],
  },
  {
    title: "Bid writing services",
    subtitle: "The core writing and project disciplines behind every submission above.",
    items: [
      {
        kicker: "01",
        title: "Tender response writing",
        body: "Full narrative responses to ITTs and RFPs, written to score against the evaluator's own criteria.",
      },
      {
        kicker: "02",
        title: "PQQ & SQ submissions",
        body: "Pre-qualification and selection questionnaire drafting, aligned to procurement stage requirements.",
      },
      {
        kicker: "03",
        title: "Case studies & evidence library",
        body: "Reusable proof points and outcome data, mapped to award criteria and kept current between bids.",
      },
      {
        kicker: "04",
        title: "Framework & DPS applications",
        body: "NHS framework agreements and dynamic purchasing system applications, including refresh windows.",
      },
      {
        kicker: "05",
        title: "Quality review",
        body: "Independent sign-off against the specification and word limits before anything is submitted.",
      },
      {
        kicker: "06",
        title: "Bid project management",
        body: "Timeline, version control and stakeholder sign-off, run against your submission deadline.",
      },
    ],
  },
];

export interface WorkCase {
  tag: string;
  title: string;
  body: string;
  meta: string;
}

export const workCases: WorkCase[] = [
  {
    tag: "Domiciliary care",
    title: "Community staffing framework",
    body: "Secured a place on a four-year framework with an evaluator score of 92%.",
    meta: "Tender value £3.2m · 3-week turnaround",
  },
  {
    tag: "Children's homes",
    title: "CQC registration & Ofsted application",
    body: "Paired applications covering safeguarding, staffing and delivery model for a new children's home.",
    meta: "Two-site opening · 10-day turnaround",
  },
  {
    tag: "ICB framework",
    title: "Estates & facilities DPS entry",
    body: "Application and evidence pack for a dynamic purchasing system, first refresh window.",
    meta: "Tender value £5.6m · 6-week turnaround",
  },
];

export const tenderTypes = [
  "Full tender response",
  "PQQ / SQ submission",
  "Framework or DPS application",
  "CQC application",
  "Ofsted application",
  "Case study & evidence pack",
  "Full bid management",
] as const;
