export const smProfile = {
  name: "S. Deshmukh",
  employeeId: "SM_1001",
  contact: "+91 98220 44556",
  designation: "Station Master",
  department: "Operations",
  station: "Nagpur Junction",
  reportingOfficer: "TI_2001 — A. Kulkarni",
  dob: "1985-04-12",
  dateOfAppointment: "2015-06-01",
  pmeDoneDate: "2024-06-02",
  pmeDueDate: "2028-06-01",
  isolatorCertificateIssuedDate: "2024-11-15",
  automaticTrainingDate: "2025-03-10",
  counsellingDate: "2026-01-20"
};

/* ─── POINTSMEN DATA ─── */
export const initialPointsmen = [
  { id:1, hrmsId:"PM_1001", name:"Ravi Kumar",   gender:"Male", age:38, doj:"2012-04-10", basePay:"₹28,500", lastScore:92, safetyScore:95, totalAssessments:12, pmeStatus:"Fit",      refStatus:"Cleared",  disciplinary:"None",    incidents:0, approvalStatus:"Pending", monitoringStatus:"Active" },
  { id:2, hrmsId:"PM_1102", name:"Sanjay Patil",  gender:"Male", age:34, doj:"2015-08-22", basePay:"₹26,200", lastScore:78, safetyScore:80, totalAssessments:9,  pmeStatus:"Fit",      refStatus:"Cleared",  disciplinary:"None",    incidents:0, approvalStatus:"Pending", monitoringStatus:"On Duty"  },
  { id:3, hrmsId:"PM_1103", name:"Deepak Nair",   gender:"Male", age:41, doj:"2009-11-05", basePay:"₹31,000", lastScore:48, safetyScore:62, totalAssessments:15, pmeStatus:"Fit",      refStatus:"Pending",  disciplinary:"Warning", incidents:1, approvalStatus:"Approved", monitoringStatus:"Off Duty" },
  { id:4, hrmsId:"PM_1104", name:"Ajay Sharma",   gender:"Male", age:29, doj:"2019-02-18", basePay:"₹23,400", lastScore:84, safetyScore:88, totalAssessments:6,  pmeStatus:"Fit",      refStatus:"Cleared",  disciplinary:"None",    incidents:0, approvalStatus:"Pending", monitoringStatus:"Active"  },
  { id:5, hrmsId:"PM_1105", name:"Kunal Verma",   gender:"Male", age:36, doj:"2013-07-30", basePay:"₹27,800", lastScore:35, safetyScore:55, totalAssessments:11, pmeStatus:"Unfit",    refStatus:"Pending",  disciplinary:"Warning", incidents:2, approvalStatus:"Rejected", monitoringStatus:"Absent" },
  { id:6, hrmsId:"PM_1106", name:"Priya Menon",   gender:"Female",age:31,doj:"2018-03-14",basePay:"₹25,100", lastScore:67, safetyScore:74, totalAssessments:7,  pmeStatus:"Fit",      refStatus:"Cleared",  disciplinary:"None",    incidents:0, approvalStatus:"Approved", monitoringStatus:"On Duty" },
  { id:7, hrmsId:"PM_1107", name:"Ramesh Yadav",  gender:"Male", age:45, doj:"2005-09-01", basePay:"₹34,600", lastScore:82, safetyScore:90, totalAssessments:18, pmeStatus:"Fit",      refStatus:"Cleared",  disciplinary:"None",    incidents:0, approvalStatus:"Approved", monitoringStatus:"Off Duty" },
  { id:8, hrmsId:"PM_1108", name:"Sneha Iyer",    gender:"Female",age:28,doj:"2020-01-20",basePay:"₹22,000", lastScore:19, safetyScore:40, totalAssessments:3,  pmeStatus:"Unfit",    refStatus:"Pending",  disciplinary:"Serious", incidents:3, approvalStatus:"Rejected", monitoringStatus:"Absent" }
];
  
/* ─── ASSESSMENT HISTORY per pointsman ─── */
export const pmAssessmentHistory = {
  1:[{id:101,date:"2026-03-28",testMarks:80,addMarks:12,total:92,grade:"A",approvalStatus:"Approved",remarks:"Excellent performance"},{id:102,date:"2025-12-15",testMarks:74,addMarks:10,total:84,grade:"A",approvalStatus:"Approved",remarks:"Good"}],
  2:[{id:103,date:"2026-03-10",testMarks:65,addMarks:13,total:78,grade:"B",approvalStatus:"Pending",remarks:"Satisfactory"}],
  3:[{id:104,date:"2026-02-15",testMarks:38,addMarks:10,total:48,grade:"C",approvalStatus:"Approved",remarks:"Needs improvement in signals"}],
  4:[{id:105,date:"2026-03-18",testMarks:72,addMarks:12,total:84,grade:"A",approvalStatus:"Pending",remarks:"Good fieldwork"}],
  5:[{id:106,date:"2026-01-20",testMarks:25,addMarks:10,total:35,grade:"D",approvalStatus:"Rejected",tiRemarks:"TI: Score too low — re-assessment required"}],
  6:[{id:107,date:"2026-03-05",testMarks:55,addMarks:12,total:67,grade:"B",approvalStatus:"Approved",remarks:"Consistent"}],
  7:[{id:108,date:"2026-03-20",testMarks:70,addMarks:12,total:82,grade:"A",approvalStatus:"Approved",remarks:"Strong safety record"}],
  8:[{id:109,date:"2026-02-01",testMarks:12,addMarks:7, total:19,grade:"D",approvalStatus:"Rejected",tiRemarks:"TI: Multiple incidents recorded"}]
};

/* ─── DRAFT ASSESSMENTS ─── */
export const initialDrafts = [
  { pointsmanId:1, hrmsId:"PM_1001", name:"Ravi Kumar",    lastDate:"2026-03-28" },
  { pointsmanId:2, hrmsId:"PM_1102", name:"Sanjay Patil",  lastDate:"2026-03-10" },
  { pointsmanId:4, hrmsId:"PM_1104", name:"Ajay Sharma",   lastDate:"2026-03-18" }
];

/* ─── YES/NO CRITERIA LABELS ─── */
export const YN_SECTIONS = [
  {
    key: "alertness", title: "Alertness and Observation of Rules",
    weight: 5, outOf: 25,
    criteria: [
      "Alert while on duty",
      "Observe rules during normal/abnormal working",
      "Do not use shortcuts during duty",
      "Clear written/verbal instructions given during duty",
      "Prompt action during abnormal situations"
    ]
  },
  {
    key: "safety", title: "Safety Record",
    weight: 3, outOf: 15,
    criteria: [
      "Awards",
      "No Chargesheet",
      "PME Done on Time",
      "REF Done on Time",
      "Record incident immediately and inform supervisor without delay"
    ]
  },
  {
    key: "leadership", title: "Leadership and Management",
    weight: 3, outOf: 15,
    criteria: [
      "Take decisions on time",
      "Give clear instructions",
      "Coordinate with fellow staff",
      "Coordinate with other departments",
      "Create a safe working environment"
    ]
  },
  {
    key: "discipline", title: "Discipline",
    weight: 2, outOf: 10,
    criteria: [
      "Appears on duty on time",
      "Regular attendance",
      "Polite with staff and passengers",
      "Strictly follows rules and procedures",
      "Maintains discipline during high workload or pressure"
    ]
  },
  {
    key: "appearance", title: "Appearance and Neatness",
    weight: 2, outOf: 10,
    criteria: [
      "Wears uniform neatly and cleanly",
      "Displays identity card properly during duty",
      "Uses safety gear (helmet, shoes, reflective jacket, etc.)",
      "Maintains records neatly",
      "Maintains workplace/premises cleanliness"
    ]
  }
];

export const defaultAssessForm = {
  knowledgeMarks: "",
  alertness:  Array(5).fill(null),
  safety:     Array(5).fill(null),
  leadership: Array(5).fill(null),
  discipline: Array(5).fill(null),
  appearance: Array(5).fill(null),
  alcoholicStatus: "",
  pmeStatus: "Fit",
  refStatus: "Cleared",
  automaticTraining: "Not Required",
  counselling: "Not Required",
  dateOfAppointment: "",
  workingSince: "",
  remarks: ""
};

/* ─── SM TEST QUESTIONS (25 MCQs) ─── */
export const smTestQuestions = [
  {
    id: 1,
    text: "Under Station Working Rules (SWR), what is the maximum speed permitted for a train passing through when main line points are set for loop line?",
    options: ["15 km/h", "30 km/h", "50 km/h", "As per Maximum Permissible Speed"],
    answer: 1,
    explanation: "As per standard operating manuals, the speed over loop lines is restricted to 30 km/h unless specifically authorized for 50 km/h with high-speed turnouts."
  },
  {
    id: 2,
    text: "In the Absolute Block System, what is the minimum distance required between two block stations to grant 'Line Clear'?",
    options: ["Station section length", "Block section length", "Adequate distance (usually 180m or 120m)", "Sighting board distance"],
    answer: 2,
    explanation: "Line Clear cannot be granted until the block section is clear and adequate distance (180m for absolute block, 120m for automatic block) is clear beyond the first stop signal."
  },
  {
    id: 3,
    text: "What does a double yellow aspect on a distant signal indicate to the loco pilot?",
    options: ["Proceed at Maximum Permissible Speed", "Prepare to stop at the next stop signal", "Prepare to pass next signal at caution/restricted speed", "Stop immediately"],
    answer: 2,
    explanation: "A double yellow aspect is an attention signal, warning the driver that they are approaching a signal showing a restrictive aspect (single yellow or red)."
  },
  {
    id: 4,
    text: "Who holds the ultimate administrative responsibility for the safe reception and dispatch of trains within station limits?",
    options: ["Section Controller", "Pointsman on duty", "Station Master", "Traffic Inspector"],
    answer: 2,
    explanation: "The Station Master is the overall in-charge of station limits and is personally responsible for ensuring all safety rules are followed during train reception and dispatch."
  },
  {
    id: 5,
    text: "When a passenger train is stopped at a station for an extended duration, what safety precaution must the Station Master take regarding the signals?",
    options: ["Ensure all reception signals are kept at green", "Ensure starter and advanced starter signals are kept at danger", "Inform the control room to disconnect track circuits", "Authorize the pointsman to reverse the points manually"],
    answer: 1,
    explanation: "Starter and advanced starter signals must be kept at 'Danger' to prevent accidental rolling or unauthorized departure of the train."
  },
  {
    id: 6,
    text: "If a train has parted mid-section, what is the primary duty of the Station Master upon noticing the parting?",
    options: ["Lower the Home signal for the next train", "Show red hand signal to the guard, do not lower signals for opposing directions", "Shunt the train immediately", "Call the Divisional Railway Manager"],
    answer: 1,
    explanation: "The SM must alert the train staff using a red hand signal to warn them of parting and ensure no other trains are authorized into the affected block section."
  },
  {
    id: 7,
    text: "What color of banner flag is used to protect a track section under engineering obstruction?",
    options: ["Green", "Yellow", "Red", "White"],
    answer: 2,
    explanation: "A red banner flag is placed across the rails to provide immediate visual protection for any track section undergoing maintenance or having an obstruction."
  },
  {
    id: 8,
    text: "How many detonators should be placed on the track to protect a train stalled in a block section on a double line?",
    options: ["1 detonator at 500m", "2 detonators at 1000m", "3 detonators (1 at 600m, 1 at 1200m, and 1 more 10m ahead)", "4 detonators placed randomly"],
    answer: 2,
    explanation: "According to general rules, 3 detonators must be placed: 1st at 600m, 2nd at 1200m, and the 3rd at 1210m from the stalled train to give warning in case of emergency."
  },
  {
    id: 9,
    text: "When points are blocked due to ballast or obstruction, what indication is observed on the VDU/Control Panel?",
    options: ["Steady green light", "Steady yellow light", "Flashing red/no indication (out of correspondence)", "Audible bell with green flashing light"],
    answer: 2,
    explanation: "When points cannot complete their operation and lock properly, they are 'out of correspondence,' showing a flashing red indicator or blank status on the panel."
  },
  {
    id: 10,
    text: "A 'Calling-on' signal is used under which of the following circumstances?",
    options: ["To permit a train to enter an obstructed line at slow speed", "To start a train from a loop line when starter is defective", "To warn the driver of an upcoming steep gradient", "To bypass shunting limits during night hours"],
    answer: 0,
    explanation: "A calling-on signal is a miniature signal fixed below a stop signal, used to admit a train into an occupied or obstructed line at restricted speed when the main signal cannot be cleared."
  },
  {
    id: 11,
    text: "Under what circumstances can a train pass a Semi-Automatic signal showing Red (Danger) in automatic territory?",
    options: ["After waiting for 1 minute by day / 2 minutes by night, then proceeding at restricted speed", "Only with written authority T-369(3b)", "Immediately at 15 km/h without stopping", "Only when accompanied by a pointsman"],
    answer: 0,
    explanation: "In automatic signaling territory, a loco pilot can pass a semi-automatic signal in automatic mode at danger after stopping for 1 min (day) or 2 min (night), proceeding with extreme caution at 10-15 km/h."
  },
  {
    id: 12,
    text: "What is the frequency of testing the emergency slide valves and emergency crossover operations by the Station Master?",
    options: ["Daily", "Weekly", "Fortnightly", "Monthly"],
    answer: 0,
    explanation: "Emergency crossover points and emergency signaling controls must be tested daily by the Station Master on duty to ensure high availability."
  },
  {
    id: 13,
    text: "During shunting of passenger coaches containing passengers, what is the maximum speed allowed?",
    options: ["15 km/h", "10 km/h", "5 km/h", "30 km/h"],
    answer: 0,
    explanation: "Shunting speed is strictly restricted to 15 km/h. When shunting coaching stock containing passengers, it must be performed with utmost care under direct supervisor control."
  },
  {
    id: 14,
    text: "What signal is used to indicate that the line is clear and shunting operations are authorized?",
    options: ["Shunt signal showing yellow", "Starter signal", "Home signal", "Shunt signal showing two white diagonal lights (or off position)"],
    answer: 3,
    explanation: "A position-light shunt signal in the 'off' position displays two diagonal white lights, indicating that shunting may proceed."
  },
  {
    id: 15,
    text: "To whom does a Gateman at an interlocked level crossing gate report immediately in case of gate defects?",
    options: ["Section Engineer (P-Way)", "Station Master in control of the section", "Traffic Inspector", "Divisional Safety Officer"],
    answer: 1,
    explanation: "The Gateman is under the direct operational control of the SM and must immediately report any gate defect or track obstruction to the SM on duty."
  },
  {
    id: 16,
    text: "Under the Absolute Block System, a train cannot enter the block section without obtaining:",
    options: ["Line Clear authority from the block station ahead", "Guard's hand signal", "Driver's whistle", "Passenger manifest clearance"],
    answer: 0,
    explanation: "Line Clear is the primary authority to proceed under the Absolute Block System, ensuring that the block section ahead is completely clear of other trains."
  },
  {
    id: 17,
    text: "The 'Advance Starter' signal is defined as:",
    options: ["The last stop signal of a station controlling entry into the block section", "The first stop signal of a station", "Shunting authority indicator", "Calling-on signal"],
    answer: 0,
    explanation: "The Advanced Starter is the last stop signal at a station, marking the boundary of station limits. Passing it represents entry into the block section."
  },
  {
    id: 18,
    text: "In case of total failure of communications on a single line section, which authority is given to the Loco Pilot?",
    options: ["T/B 602 (Authority to proceed during total failure)", "T/A 602", "T/C 602", "T/D 602"],
    answer: 0,
    explanation: "Form T/B 602 is the official authority issued to run trains during total failure of communication on a single line block section."
  },
  {
    id: 19,
    text: "When points are to be hand-cranked due to motor failure, what safety action is mandatory for the Station Master?",
    options: ["Ensure crank handle is locked back in the key box or kept in personal custody after use", "Rely entirely on the pointsman's verbal confirmation", "Lower the reception signals before cranking begins", "None, cranking is done independently by P-Way staff"],
    answer: 0,
    explanation: "The SM must keep the crank handle in safe custody or locked in the transmission box to prevent unauthorized point reversal during train movements."
  },
  {
    id: 20,
    text: "What form is issued to authorize a train to pass a defective Reception Stop Signal at Danger?",
    options: ["T/511", "T/512", "T/369(3b)", "T/806"],
    answer: 2,
    explanation: "Form T/369(3b) is the written authority to pass a defective reception stop signal at danger, which also contains speed restriction instructions."
  },
  {
    id: 21,
    text: "A Sighting Board is placed at what minimum distance before the First Stop Signal?",
    options: ["1400 metres", "1000 metres", "800 metres", "2000 metres"],
    answer: 0,
    explanation: "A sighting board is placed 1400 meters before the First Stop Signal (FSS) on high-speed lines to warn loco pilots of the upcoming signal location."
  },
  {
    id: 22,
    text: "What is the minimum adequate distance (overlap) required for shunting within station limits in the face of an approaching train?",
    options: ["45 metres", "180 metres", "120 metres", "90 metres"],
    answer: 1,
    explanation: "Under general safety rules, shunting must not be permitted within 180 meters of the path of an approaching train to prevent collision hazards."
  },
  {
    id: 23,
    text: "A flashing amber aspect on an auxiliary route indicator warns the driver of:",
    options: ["Severe speed restriction ahead", "Route deviation ahead onto a loop line", "Normal running speed on the main line", "Stop at next block station"],
    answer: 1,
    explanation: "A flashing amber aspect warns the loco pilot that the train is being routed onto a loop line or crossing over points, requiring an immediate speed reduction."
  },
  {
    id: 24,
    text: "During heavy rains or waterlogging exceeding rail level, what is the duty of the Station Master?",
    options: ["Suspend all traffic on the affected line and inform the controller", "Allow trains to pass at 15 km/h", "Allow trains only if the guard issues a permit", "Keep reception signals green to clear the yard"],
    answer: 0,
    explanation: "If water rises above rail level, the SM must immediately suspend train movements over that section, protect the track, and report the condition to the section controller."
  },
  {
    id: 25,
    text: "For shunting over a facing point that is not interlocked or has defective interlocking, what is the mandatory safety precaution?",
    options: ["Points must be clipped and padlocked", "Points must be clamped only", "Pointsman must hold the point lever manually", "No precaution needed, shunting speed is slow"],
    answer: 0,
    explanation: "Non-interlocked facing points must be securely clipped and padlocked before any train or shunting movement is authorized over them to prevent derailments."
  }
];

/* ─── SM SELF-ASSESSMENT HISTORY (done by TI) ─── */
export const smAssessmentHistory = [];

/* ─── SM SELF‑ASSESSMENT (done by TI) ─── */
export const smSelfAssessment = {
  date: "2026-03-25",
  period: "Q1 2026",
  assessedBy: "TI_2001 — R. Khan",
  totalScore: 86,
  category: "A",
  approvalStatus: "Approved",
  tiRemarks: "Station demonstrates strong operational discipline and safety culture.",
  sections: [
    { title: "Knowledge of Rules (MCQ)",         marks: 22, outOf: 25 },
    { title: "Alertness and Observation of Rules", marks: 22, outOf: 25 },
    { title: "Safety Record",                     marks: 13, outOf: 15 },
    { title: "Leadership and Management",         marks: 13, outOf: 15 },
    { title: "Discipline",                        marks: 8, outOf: 10 },
    { title: "Appearance and Neatness",           marks: 8, outOf: 10 }
  ]
};

/* ─── MONTHLY TREND DATA ─── */
export const monthlyTrend = [
  { month:"Nov 25", assessments:6, avgScore:71, safetyAvg:68 },
  { month:"Dec 25", assessments:5, avgScore:74, safetyAvg:72 },
  { month:"Jan 26", assessments:7, avgScore:68, safetyAvg:70 },
  { month:"Feb 26", assessments:8, avgScore:77, safetyAvg:75 },
  { month:"Mar 26", assessments:8, avgScore:80, safetyAvg:79 }
];

/* ─── CUSTOM TOOLTIP ─── */



/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */