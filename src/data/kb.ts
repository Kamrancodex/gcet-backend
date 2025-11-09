export type KBItem = {
  id: string;
  title: string;
  content: string; // rich text used for retrieval
  tags?: string[];
};

// Minimal GCET knowledge base (expandable). Content should be factual and concise.
export const KB_DOCS: KBItem[] = [
  {
    id: "campus-a-block",
    title: "Campus A Block Location",
    content:
      "A Block is near the GCET main entrance. From the front gate, walk straight about 150 meters; A Block is the first large academic building on the right side.",
    tags: ["campus", "map", "location", "a block", "block a"],
  },
  {
    id: "exams-mid-sem",
    title: "Mid-Semester Exam Window",
    content:
      "Mid-semester exams (Mid-Sem) are typically held during weeks 7 to 8 of the semester. The Exam Cell publishes exact dates via official notices and the Notices page.",
    tags: ["exam", "mid sem", "schedule", "dates"],
  },
  {
    id: "exams-end-sem",
    title: "End-Semester Exam Window",
    content:
      "End-semester exams (End-Sem) are generally scheduled in the last 2 to 3 weeks of the semester. Final timetables are announced by the Exam Cell in official notices.",
    tags: ["exam", "end sem", "schedule", "dates"],
  },
  {
    id: "registration-howto",
    title: "Semester Registration Process",
    content:
      "To register for the semester, open the Dashboard and go to Registration. Select an active Registration Session, then complete and submit the Student Registration Form. The dashboard shows your registration status after submission.",
    tags: ["registration", "semester", "apply"],
  },
  {
    id: "library-noc-process",
    title: "Library NOC Process",
    content:
      "For Library NOC: go to Dashboard → Library → NOC. Ensure there are no outstanding dues or books. Submit the NOC request and the Library team will process it.",
    tags: ["library", "noc", "clearance"],
  },
  {
    id: "faculty-cse-sem5",
    title: "Faculty for 5th Semester CSE",
    content:
      "Faculty assignments for 5th semester CSE can change each session. Check Dashboard → Notices or the Departments page for the latest faculty-course allocation.",
    tags: ["faculty", "cse", "semester 5"],
  },
  {
    id: "about-institution",
    title: "About GCET Safapora, Ganderbal, Kashmir",
    content:
      "The Government College of Engineering and Technology (GCET) is located in a lush green landscape near the banks of Manasbal Lake, nestled between two hillocks at Safapora, Ganderbal, Kashmir. It offers undergraduate B.Tech programs in core engineering branches.",
    tags: [
      "about",
      "institution",
      "location",
      "manasbal",
      "safapora",
      "ganderbal",
    ],
  },
  {
    id: "principal-message",
    title: "Principal’s Message (Dr. Rauf Ahmad Khan)",
    content:
      "GCET was established by the Government of J&K in 2017. The institute focuses on preparing industry-ready, employable engineers who can offer technological solutions to local problems, aiming for innovation and patents as indicators of academic progress.",
    tags: ["principal", "vision", "mission", "2017"],
  },
  {
    id: "departments-list",
    title: "Departments at GCET",
    content:
      "Departments include Civil Engineering, Electrical & Electronics Engineering, Computer Science & Engineering, Mechanical Engineering, Biomedical Engineering, and Applied Sciences & Humanities.",
    tags: [
      "departments",
      "civil",
      "eee",
      "cse",
      "mechanical",
      "biomedical",
      "applied sciences",
    ],
  },
  {
    id: "civil-overview",
    title: "Department of Civil Engineering - Overview",
    content:
      "Civil Engineering offers a 4-year B.Tech with intake 60+3. The department provides consultancy services to government and public sector agencies and aims to develop scientific and technical foundations for civil construction and sustainable development.",
    tags: ["civil", "intake", "consultancy", "btech"],
  },
  {
    id: "civil-hod",
    title: "Civil Engineering - Head of Department",
    content: "Head of Department: Mr. Saleem Iqbal (Associate Professor).",
    tags: ["civil", "hod", "saleem iqbal"],
  },
  {
    id: "eee-overview",
    title: "Department of Electrical & Electronics Engineering - Overview",
    content:
      "EEE started in 2017 with AICTE approval and offers a 4-year B.Tech program to meet the need for practical design engineers. Focus areas include Electrical, Electronics, and Communication engineering with emphasis on design of systems.",
    tags: ["eee", "2017", "aicte", "btech"],
  },
  {
    id: "eee-hod",
    title: "EEE - Head of Department",
    content:
      "Head of Department: Er. Safina (Safeena) Al Nisa (Associate Professor).",
    tags: ["eee", "hod", "safeena al nisa"],
  },
  {
    id: "cse-overview",
    title: "Department of Computer Science & Engineering - Overview",
    content:
      "The CSE department was established in 2018. Faculty interests include Information Security, Software Engineering, Machine Learning, Image Processing, Networks, IoT, Cloud/Grid Computing, Pattern Recognition, NLP, Robotics, Simulation and Modeling.",
    tags: ["cse", "2018", "ml", "iot", "cloud", "nlp"],
  },
  {
    id: "cse-hod",
    title: "CSE - Head of Department",
    content: "Head of Department: Prof. Aasia Quyoum (Assistant Professor).",
    tags: ["cse", "hod", "aasia quyoum"],
  },
  {
    id: "me-overview",
    title: "Department of Mechanical Engineering - Overview",
    content:
      "Mechanical Engineering provides scientific and technical background for innovation, design, development, implementation, and manufacturing of engineering systems.",
    tags: ["mechanical", "design", "manufacturing"],
  },
  {
    id: "biomed-overview",
    title: "Department of Biomedical Engineering - Overview",
    content:
      "Biomedical Engineering is a 4-year B.Tech program applying engineering principles to biology and medicine. Areas include prostheses, artificial organs, devices, imaging, and diagnostics. Graduates work in industry, government, hospitals, and academia.",
    tags: ["biomedical", "btech", "healthcare"],
  },
  {
    id: "applied-overview",
    title: "Department of Applied Sciences & Humanities - Overview",
    content:
      "The department supports B.Tech programs via courses in Mathematics, Physics, Chemistry, English, Management, Environmental Sciences, and Physical Education, emphasizing interdisciplinary learning and application of scientific knowledge.",
    tags: [
      "applied sciences",
      "humanities",
      "math",
      "physics",
      "chemistry",
      "english",
    ],
  },
  {
    id: "fee-structure-2022",
    title: "Fee Structure - First Semester (2022)",
    content:
      "First semester fees: 22,550 INR (JKBOSE, non-TFW). 23,350 INR (non-JKBOSE, non-TFW). 20,050 INR (JKBOSE, TFW). 20,850 INR (non-JKBOSE, TFW). Fees payable after document verification by the college admission committee.",
    tags: ["fees", "first semester", "2022", "tfw"],
  },
  {
    id: "intake-capacity",
    title: "Branch-wise Intake Capacity",
    content:
      "Intake per branch: Electrical & Electronics Engineering 60, Computer Science & Engineering 60, Mechanical Engineering 60, Civil Engineering 60, Biomedical Engineering 60.",
    tags: ["intake", "capacity", "seats"],
  },
  {
    id: "admission-procedure",
    title: "Admission Procedure (UG B.Tech)",
    content:
      "Admission to B.Tech is based on merit in CET conducted by J&K BOPEE. Selected candidates visit GCET Safapora with required original documents, obtain admission form from the admission section, and submit along with challan and documents by the deadline notified by BOPEE.",
    tags: ["admission", "bopee", "cet", "procedure"],
  },
  {
    id: "required-documents",
    title: "Required Documents for Admission",
    content:
      "Required originals (with two self-attested copies): 10+2 marks certificate, 10th marks card, 10+2 provisional certificate, migration certificate (if applicable), discharge and character certificates, medical fitness certificate, category certificate (if applicable), domicile certificate (J&K), bank passbook copy, 10 passport photos with name and JK CET rank, online anti-ragging affidavits, and undertakings A/B as applicable.",
    tags: ["documents", "admission", "requirements"],
  },
  {
    id: "identity-card-rules",
    title: "Identity Card Rules",
    content:
      "Every admitted student is issued an identity card and must carry it on campus and produce on demand. Loss should be reported immediately. Duplicate cards are issued after verification. The card must be returned after completion of the B.Tech degree.",
    tags: ["id card", "rules"],
  },
  {
    id: "general-rules",
    title: "General Rules",
    content:
      "No outsider without valid reason. Unlawful assembly not allowed. Graffiti/posters are offences. Ragging is a cognizable offence with severe punishment (including expulsion). Unfair means in exams may lead to bad character certificate. Park vehicles in designated student parking only.",
    tags: ["rules", "ragging", "discipline", "parking"],
  },
  {
    id: "selection-procedure",
    title: "Selection Procedure",
    content:
      "Selection for 4-year B.Tech is by the selection authority: J&K BOPEE (CET) for first year and Cluster University Srinagar for lateral entry seats. The college does not conduct selection.",
    tags: ["selection", "bopee", "cluster university", "lateral entry"],
  },
  {
    id: "scholarships-overview",
    title: "Scholarships Overview and 2019–2020 Stats",
    content:
      "Multiple government scholarship schemes are available. Eligible students can apply via the institute after verification. In 2019–2020, 305 students received scholarships totaling INR 65,72,575. Reference portals/schemes include National Scholarship Portal, AICTE PRAGATI (Girls) and AICTE SAKSHAM (Specially‑abled).",
    tags: ["scholarship", "nsp", "aicte", "pragati", "saksham", "2019", "2020"],
  },
  {
    id: "college-committees",
    title: "College Committees",
    content:
      "Key committees: Anti‑Ragging Committee, Anti‑Ragging Squad, Internal Complaint Committee, Student Counsellors, IQAC, Institution‑Industry Cell, Grievance Redressal Committee for Faculty, Student Grievance Redressal Committee, SC/ST Committee.",
    tags: ["committee", "anti ragging", "iqac", "grievance", "icc"],
  },
  {
    id: "tenders-example",
    title: "Tenders (Example)",
    content:
      "Example tender: Supply of books to GCET Safapora, Ganderbal Kashmir (E‑NIT No. 01 of 2024, dated 02/11/2024). Portal: www.jktenders.gov.in.",
    tags: ["tender", "books", "e‑nit", "2024", "jktenders"],
  },
  {
    id: "anti-ragging-laws",
    title: "Anti‑Ragging Laws and Regulations (Summary)",
    content:
      "Ragging is prohibited. Key references: IPC provisions (e.g., 294, 323, 324, 325, 326, 339–342, 506), UGC Regulations 2009, AICTE Prevention and Prohibition Regulations 2009, MCI 2009. Institutions must file FIRs for incidents. Punishments include cancellation of admission, suspension, withdrawal of benefits, debarment from exams/hostel, fines up to INR 25,000, and expulsion. The Anti‑Ragging Committee and Squad conduct prevention and enforcement; freshers are protected with dedicated measures and helplines.",
    tags: ["anti ragging", "ipc", "ugc 2009", "aicte 2009", "punishment"],
  },
  {
    id: "placement-cell",
    title: "Training & Placement Cell",
    content:
      "A placement cell operates to prepare final‑year students. As the institute is in early stages (no graduating batch yet), the cell focuses on training and generating opportunities through the year to build confidence and readiness.",
    tags: ["placement", "training", "careers"],
  },
  {
    id: "library-overview",
    title: "Central Library Overview",
    content:
      "GCET Central Library (est. 2018) holds ~4,367 books covering Civil, Mechanical, Biomedical, Electrical, Electronics, and Computer Science. Services are for students, faculty and staff. Visiting hours: 10:00–16:00 (summer), 10:30–16:00 (winter). Rules include carrying library card, 15‑day issue period with INR 1/day overdue fine, open access system, DDC (000–999) shelf arrangement, and standard conduct requirements (no food, silence, no re‑shelving).",
    tags: ["library", "books", "rules", "hours", "2018"],
  },
  {
    id: "library-staff",
    title: "Central Library Staff (Contacts)",
    content:
      "Librarian: Mr. Tahir Ahmad Batt (MLIS, NET, SET) – TAHIRBATT2021@GMAIL.COM, 9906092100. Library Assistant: Javaid Ahmad Bhat (MLIS, NET) – JAVAID.BHAT@GMAIL.COM, 9149641264.",
    tags: ["library", "staff", "contact"],
  },
  {
    id: "sports-center",
    title: "Sports Center",
    content:
      "Sports Center is being established at GCET Safapora. Students are invited to participate and register. Head: Sarfaraz Hussain Malik (Assistant Physical Director). Staff: Ms. Gulafshan Shafi (Physical Training Instructor) – gulafshanmufti3@gmail.com.",
    tags: ["sports", "center", "physical education"],
  },
  {
    id: "directory-civil-faculty",
    title: "Directory – Civil Engineering Faculty (Selection)",
    content:
      "Civil Engineering faculty (sample): Ilyas Ahmad Bhat (Asst. Professor, Academic Arrangement), Dr. Nadeem Gulzar Shahmir (Asst. Professor, M.Tech, PhD, nadeemshahmir@gmail.com, 9419019294), Sadiya Nabi, Ishfaq Ahmed Dar, Tajamul Islam, Ariba Shafi, Andleeb Gul (all Asst. Professor, Academic Arrangement).",
    tags: ["directory", "civil", "faculty"],
  },
  {
    id: "directory-eee-faculty",
    title:
      "Directory – Electrical & Electronics Engineering Faculty (Selection)",
    content:
      "EEE faculty: Er. Safeena Al Nisa (Associate Professor & HoD, M.Tech, safeena.alnisa@gmail.com, 9419108357); Mr. Manzoor Ahmad Wagay (Asst. Professor, M.Tech, wagaymanzoor449@gmail.com, 9596150966); Danish Hameed; Uznain Farooq; Kousar Jan; Sajad Ahmad Wani; Mr. Nimra Habib (Asst. Professor E&C, M.Tech, nimmerhabib@yahoo.com, 9018960168); Sayima Nazir; Mubashir Yaseen.",
    tags: ["directory", "eee", "faculty"],
  },
  {
    id: "directory-cse-faculty",
    title: "Directory – Computer Science & Engineering Faculty (Selection)",
    content:
      "CSE faculty: Ms. Aasia Quyoum (Assistant Professor & HoD, MCA, MPhil, SET, aasia27@gmail.com); Mr. Parvaz Ahmad (Assistant Professor, MCA, MPhil, NET, hed.parvaz@gmail.com); Dr. Aafaq Mohi Ud Din (Assistant Professor, M.Tech, PhD, GATE, NET, SET, cse.aafaq@gmail.com); Dr. Auqib Hamid Lone (Assistant Professor, M.Tech, PhD, GATE, NET‑JRF, SET, auqib92@gmail.com); Mohammad Ilyas Malik; Faiqa Farooq; Bisma Rashid; Mushtaq Ahmad Dar (several on Academic Arrangement).",
    tags: ["directory", "cse", "faculty"],
  },
  {
    id: "directory-me-faculty",
    title: "Directory – Mechanical Engineering Faculty (Selection)",
    content:
      "Mechanical faculty: Sheikh Idrees Ali; Yunis Ahmad Dar; Shahid Manzoor Wani; Mohd Rafiq Shiekh; Afroza Bano; Uzma Ashraf (all Asst. Professor, Academic Arrangement).",
    tags: ["directory", "mechanical", "faculty"],
  },
  {
    id: "directory-biomed-faculty",
    title: "Directory – Biomedical Engineering Faculty (Selection)",
    content:
      "Biomedical faculty: Omar Hussain; Qaysar Mohi Ud Din (Asst. Professors, Academic Arrangement).",
    tags: ["directory", "biomedical", "faculty"],
  },
  {
    id: "directory-applied-faculty",
    title: "Directory – Applied Sciences & Humanities Faculty (Selection)",
    content:
      "Applied Sciences & Humanities faculty: Mr. Saleem Iqbal (Associate Professor – Mathematics, M.Sc., siqbal44@gmail.com, 7889761387); Mr. Sameer Ahmad Gupkari (Assistant Professor – Mathematics, M.Sc., MPhil, NET, samath.ein@gmail.com, 9103900572); Ms. Tuba Rashid (Assistant Professor – English, M.A, MPhil, NET); plus additional faculty in Mathematics, Humanities & Management, and Chemistry.",
    tags: ["directory", "applied sciences", "humanities", "faculty"],
  },
  {
    id: "directory-office-staff",
    title: "Directory – Office Staff (Selection)",
    content:
      "Office Staff: Mr. Mohammad Farooq (Senior Assistant, 7006545164); Mr. Ab Rashid Wagay (Lab Bearer, 6005499683).",
    tags: ["directory", "office", "staff"],
  },
];
