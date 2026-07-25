// Clinical content structured from:
// Kittleson MM et al. Management of Heart Failure With Preserved Ejection
// Fraction: 2026 ACC Expert Consensus Decision Pathway. J Am Coll Cardiol 2026.
// This is decision support, not a substitute for clinical judgment.

export type Mimic = {
  name: string;
  category: "Noncardiac" | "Cardiac";
  clues: string[];
  workup: string[];
};

export const mimics: Mimic[] = [
  {
    name: "Pulmonary disease (COPD, asthma, ILD, pulmonary hypertension)",
    category: "Noncardiac",
    clues: ["Chronic cough", "Wheezing", "Hypoxemia", "Reduced DLCO", "Right heart failure predominance"],
    workup: ["Pulmonary function tests", "Chest radiograph or CT", "V/Q scan or CT-PA if thromboembolic disease suspected", "Cardiopulmonary exercise testing", "Right heart catheterization"],
  },
  {
    name: "Kidney disease",
    category: "Noncardiac",
    clues: ["Volume overload", "Long-standing CKD", "Elevated natriuretic peptides unrelated to cardiac dysfunction"],
    workup: ["Kidney function panel", "Clinical and ultrasound-based volume assessment"],
  },
  {
    name: "High-output states (liver disease, anemia, hyperthyroidism, AV fistula, systemic inflammation)",
    category: "Noncardiac",
    clues: ["Tachycardia", "Warm extremities", "Widened pulse pressure", "Elevated cardiac output"],
    workup: ["CBC", "TSH", "Liver function tests + imaging", "Inflammatory markers", "Echocardiography", "Right heart catheterization"],
  },
  {
    name: "Obesity",
    category: "Noncardiac",
    clues: ["Lower natriuretic peptide levels", "Preserved cardiac structure", "Exertional limitation out of proportion to imaging"],
    workup: ["Cardiopulmonary exercise testing", "Right heart catheterization", "Functional assessment"],
  },
  {
    name: "Frailty or deconditioning",
    category: "Noncardiac",
    clues: ["Weight loss or gain", "Exhaustion", "Reduced grip strength", "Slow gait speed", "Low physical activity"],
    workup: ["Clinical evaluation + frailty scales", "Bloods incl. CBC, TSH", "Cardiopulmonary exercise testing", "Right heart catheterization"],
  },
  {
    name: "Valvular heart disease (AS, MR, MS)",
    category: "Cardiac",
    clues: ["Murmurs", "Symptoms disproportionate to preserved EF"],
    workup: ["Transthoracic echocardiography with Doppler"],
  },
  {
    name: "Pericardial constriction",
    category: "Cardiac",
    clues: ["Prior cardiac surgery, chest radiation, or pericarditis", "Kussmaul sign", "Right-sided congestion"],
    workup: ["TTE with Doppler", "Right + left heart catheterization (ventricular interdependence)"],
  },
  {
    name: "Ischemic heart disease",
    category: "Cardiac",
    clues: ["Dyspnea as an anginal equivalent"],
    workup: ["Stress imaging", "Coronary angiography", "Coronary functional assessment"],
  },
  {
    name: "Cardiac amyloidosis",
    category: "Cardiac",
    clues: ["Increased LV wall thickness with discordant ECG voltage", "Carpal tunnel syndrome / lumbar stenosis", "Sensory or autonomic neuropathy"],
    workup: ["Monoclonal protein screen (serum/urine immunofixation + free light chains)", "Bone-avid radionuclide scintigraphy", "Endomyocardial biopsy if monoclonal screen positive", "TTR genetic testing"],
  },
  {
    name: "Hypertrophic cardiomyopathy",
    category: "Cardiac",
    clues: ["Unexplained LV hypertrophy", "LVOT obstruction", "Family history"],
    workup: ["Cardiac MRI if echo uncertain", "Genetic testing"],
  },
  {
    name: "Cardiac sarcoidosis",
    category: "Cardiac",
    clues: ["Extracardiac disease (pulmonary, ocular, dermatologic)", "High-degree AV block, esp. age <60y", "Ventricular arrhythmias"],
    workup: ["Cardiac MRI", "FDG-PET", "Tissue biopsy (cardiac or extracardiac)"],
  },
  {
    name: "Hemochromatosis",
    category: "Cardiac",
    clues: ["Family history / frequent transfusions", "Diabetes", "Erectile dysfunction"],
    workup: ["Ferritin + transferrin", "HFE genetic testing", "CMR with T2* imaging"],
  },
  {
    name: "Fabry disease",
    category: "Cardiac",
    clues: ["Angiokeratomas", "Sensory neuropathy", "Proteinuria", "X-linked inheritance"],
    workup: ["Serum alpha-galactosidase (in men)", "GLA genetic testing", "Biopsy of affected tissue"],
  },
];

export type DrugClass = {
  className: string;
  agents: { name: string; start: string; target: string }[];
  indications: string;
  contraindications: string[];
  cautions: string[];
};

export const drugClasses: DrugClass[] = [
  {
    className: "SGLT2 inhibitor",
    agents: [
      { name: "Dapagliflozin", start: "10 mg daily", target: "10 mg daily" },
      { name: "Empagliflozin", start: "10 mg daily", target: "10 mg daily" },
      { name: "Sotagliflozin*", start: "200 mg daily", target: "400 mg daily" },
    ],
    indications: "Cornerstone therapy for all HFpEF regardless of diabetic status; reduces HF hospitalization + CV death, improves health status. *Sotagliflozin benefit shown only in T2DM recently hospitalized for HF regardless of EF.",
    contraindications: ["Type 1 diabetes mellitus", "Pregnancy", "Lactation", "Known hypersensitivity"],
    cautions: [
      "eGFR <25 (dapagliflozin) or <20 (empagliflozin) mL/min/1.73m²",
      "Mycotic genital / urinary tract infections",
      "Volume depletion or hypotension",
      "Euglycemic ketoacidosis risk (poorly controlled diabetes, fasting, ketogenic diet, excess alcohol, dehydration)",
      "Acute kidney injury",
      "Fournier's gangrene (rare, serious)",
    ],
  },
  {
    className: "Nonsteroidal MRA (preferred)",
    agents: [
      { name: "Finerenone", start: "10 mg daily (eGFR 25–59) / 20 mg daily (eGFR ≥60)", target: "20 mg daily (eGFR 25–59) / 40 mg daily (eGFR ≥60)" },
    ],
    indications: "MRA of choice in HFpEF — improved MR selectivity, short half-life, reduced hyperkalemia risk. FDA-approved (July 2025) to reduce CV death, HF hospitalization, and urgent HF visits in HF with LVEF ≥40%.",
    contraindications: ["eGFR <25 mL/min/1.73m²", "Potassium ≥5.0 mmol/L", "Strong/moderate CYP3A4 inhibitors or inducers", "Addison disease", "Pregnancy"],
    cautions: ["Hyperkalemia — adjust by K+, eGFR, current dose", "Hypotension", "Weak CYP3A4 inhibitors", "Concomitant K+-raising drugs (K+ supplements, ACEI/ARB/ARNI, NSAIDs, trimethoprim)", "Lactation"],
  },
  {
    className: "Steroidal MRA (alternative)",
    agents: [{ name: "Spironolactone", start: "25 mg daily", target: "50 mg daily" }],
    indications: "Reasonable alternative if finerenone cost/tolerance prohibitive. Improves diastolic function measures; secondary HF-hospitalization benefit in TOPCAT (North America subgroup).",
    contraindications: ["Potassium ≥5.0 mmol/L", "eGFR <30 mL/min/1.73m² or creatinine ≥2.5 mg/dL", "Addison disease", "Pregnancy", "Known hypersensitivity"],
    cautions: ["Worsening kidney function", "Concomitant K+-raising drugs", "Gynecomastia (consider eplerenone)", "Lactation"],
  },
  {
    className: "Incretin-based therapy",
    agents: [
      { name: "Semaglutide", start: "0.25 mg weekly", target: "2.4 mg weekly (up-titrate q4wk: 0.25→0.5→1.0→1.7→2.4 mg)" },
      { name: "Tirzepatide", start: "2.5 mg weekly", target: "15 mg weekly (up-titrate q4wk: 2.5→5→7.5→10→12.5→15 mg)" },
    ],
    indications: "For BMI ≥30 kg/m² with HFpEF (EF ≥45% semaglutide / ≥50% tirzepatide): improves KCCQ, 6-min walk, NYHA class; may reduce worsening HF events. Pair with exercise/nutrition to counter sarcopenic obesity.",
    contraindications: ["Personal/family history of medullary thyroid carcinoma or MEN2", "Pregnancy", "Lactation", "Known hypersensitivity"],
    cautions: ["Severe GI adverse effects with volume depletion", "Severe gastroparesis", "Acute gallbladder disease", "Acute pancreatitis", "Hypoglycemia with insulin/sulfonylurea", "Aspiration risk under anesthesia/deep sedation", "Hair loss"],
  },
  {
    className: "ARNI",
    agents: [{ name: "Sacubitril/valsartan", start: "24/26 mg twice daily", target: "97/103 mg twice daily" }],
    indications: "Consider particularly for women or LVEF <55–60%, or when additional BP control is needed. Modest benefit vs valsartan in PARAGON-HF, most evident below-median EF.",
    contraindications: ["Coadministration within 36h of ACEI", "History of any angioedema", "Pregnancy", "Lactation", "Severe (Child-Pugh C) hepatic impairment", "Known hypersensitivity"],
    cautions: ["Halve starting dose if: not on ACEI/ARB or on low dose, eGFR <30, moderate hepatic impairment, renal artery stenosis, hypotension"],
  },
  {
    className: "ARB",
    agents: [{ name: "Candesartan", start: "4–8 mg daily", target: "32 mg daily" }],
    indications: "Reasonable alternative when ARNI not feasible/contraindicated, particularly with hypertension. Modest reduction in HF hospitalization (CHARM-Preserved); not replicated with irbesartan.",
    contraindications: ["Pregnancy/lactation", "Concomitant ACEI, aliskiren, or ARNI", "Known hypersensitivity"],
    cautions: ["History of angioedema", "Hyperkalemia", "Hypotension", "Acute kidney injury"],
  },
];

export const beta2FpefComponents = [
  { key: "heavy", label: "Heavy — BMI >30 kg/m²", points: 2 },
  { key: "hypertensive", label: "On ≥2 antihypertensive agents", points: 1 },
  { key: "af", label: "Atrial fibrillation", points: 3 },
  { key: "pulmHtn", label: "Pulmonary hypertension (PASP >35 mmHg on Doppler)", points: 1 },
  { key: "elder", label: "Elder — age >60 years", points: 1 },
  { key: "fillingPressure", label: "Filling pressure — E/e' >9 on Doppler", points: 1 },
] as const;

export const comorbidityGuidance: { name: string; points: string[] }[] = [
  { name: "Hypertension", points: ["Target SBP 120–129 mmHg (narrower than general CKM target of <130/80)", "ARNI, ARB, or MRA preferred as pragmatic antihypertensives", "Both SBP ≥140 and <120 mmHg associate with worse outcomes"] },
  { name: "Type 2 diabetes", points: ["SGLT2 inhibitor first-line", "GLP-1RA if ASCVD or obesity or CKD", "Nonsteroidal MRA if CKD present", "Avoid alogliptin, saxagliptin, thiazolidinediones — increased HF event risk"] },
  { name: "Obesity", points: ["Weight loss to improve functional status and QOL", "Exercise + caloric restriction", "Semaglutide or tirzepatide (BMI ≥30)", "Multidisciplinary approach incl. consideration of bariatric surgery"] },
  { name: "Chronic kidney disease", points: ["RAS inhibitors (ACEI/ARB)", "Nonsteroidal MRA (finerenone)", "SGLT2 inhibitors", "GLP-1 receptor agonists", "Slows CKD progression while treating HF"] },
  { name: "Atrial fibrillation", points: ["Rate vs rhythm strategy guided by symptoms", "Avoid aggressive rate control — chronotropic incompetence", "Anticoagulate unless contraindicated", "Treat hypertension, T2DM, obesity to reduce AF burden", "Catheter ablation associated with lower death/CV/HF events vs rate control in observational/secondary analyses"] },
  { name: "Coronary artery disease", points: ["Testing/intervention guided by presentation and symptoms", "High-intensity statin, antiplatelet, BP control", "SGLT2i or GLP-1RA in T2DM + established ASCVD"] },
];

export const treatmentSteps = [
  { title: "1. Confirm diagnosis", body: "Establish HFpEF per Universal Definition (symptoms/signs of HF + LVEF ≥50% + elevated natriuretic peptides or objective congestion), after excluding noncardiac and cardiac mimics." },
  { title: "2. Foundational therapy", body: "Start an SGLT2 inhibitor AND a nonsteroidal MRA (finerenone) unless contraindicated — reduces CV death and HF hospitalization, improves health status. This is the base of optimal medical therapy regardless of phenotype." },
  { title: "3. Phenotype-directed add-on", body: "BMI ≥30 kg/m² → add incretin-based therapy (semaglutide/tirzepatide). Women (any EF) or LVEF <55–60% with hypertension → add ARNI. ARNI contraindicated/not feasible → add ARB, particularly if hypertension needs additional control." },
  { title: "4. Congestion control", body: "Loop diuretics titrated judiciously to relieve congestion; thiazide or carbonic anhydrase inhibitors as adjuncts if hospitalized with decompensation." },
  { title: "5. Beta-blockers — avoid unless indicated", body: "No established mortality/HF benefit in HFpEF; may worsen exertional capacity via chronotropic incompetence. Reserve for angina or AF rate control, at the lowest effective dose, with a low threshold to reduce/stop if congestion or intolerance worsens." },
  { title: "6. Nonpharmacologic management", body: "Structured exercise (aerobic ± resistance) for functional capacity and QOL. Caloric restriction with exercise in obesity-related HFpEF. Consider implantable pulmonary artery monitoring in NYHA III with recurrent hospitalization, volume lability, cardiorenal syndrome, or diagnostic difficulty from comorbid obesity/lung disease." },
  { title: "7. Comorbidity optimization", body: "Address hypertension, type 2 diabetes, obesity, atrial fibrillation, CAD, and CKD in parallel — CKM comorbidity burden is directly associated with hospitalization risk (23% increase per severe condition; 57% with 2–3 conditions)." },
  { title: "8. Follow-up", body: "Reassess symptoms (NYHA class), weight/volume status, renal function and potassium 1–2 weeks after MRA/ARNI initiation or dose change, and titrate toward target doses as tolerated. Repeat KCCQ or similar QOL measure and 6-minute walk periodically to track functional trajectory. Re-screen for evolving mimics if the clinical trajectory doesn't fit HFpEF." },
];
