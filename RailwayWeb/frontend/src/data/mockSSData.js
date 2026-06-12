/* Auto-extracted mock data for Station Superintendent */

const INIT_STATIONS = [
  { id: "ST01", name: "Parbhani Junction", code: "PBN", avgScore: 82, safetyPct: 88, highRisk: 1, pointsmenCount: 10 },
  { id: "ST02", name: "Amla Junction", code: "AMLA", avgScore: 65, safetyPct: 71, highRisk: 3, pointsmenCount: 8 },
  { id: "ST03", name: "Badnera Junction", code: "BD", avgScore: 78, safetyPct: 83, highRisk: 1, pointsmenCount: 7 },
  { id: "ST04", name: "Nagpur Junction", code: "NGP", avgScore: 89, safetyPct: 94, highRisk: 0, pointsmenCount: 12 },
  { id: "ST05", name: "Akola Junction", code: "AK", avgScore: 71, safetyPct: 76, highRisk: 2, pointsmenCount: 8 },
  { id: "ST06", name: "Wardha Junction", code: "WR", avgScore: 80, safetyPct: 85, highRisk: 1, pointsmenCount: 9 },
  { id: "ST07", name: "Betul Station", code: "BYT", avgScore: 74, safetyPct: 80, highRisk: 1, pointsmenCount: 6 },
  { id: "ST08", name: "Itarsi Junction", code: "ET", avgScore: 85, safetyPct: 91, highRisk: 1, pointsmenCount: 11 },
  { id: "ST09", name: "Chandrapur Station", code: "CD", avgScore: 68, safetyPct: 73, highRisk: 2, pointsmenCount: 7 },
  { id: "ST10", name: "Gondia Junction", code: "G", avgScore: 82, safetyPct: 87, highRisk: 0, pointsmenCount: 9 },
  { id: "ST11", name: "Dhamangaon Station", code: "DMN", avgScore: 73, safetyPct: 79, highRisk: 1, pointsmenCount: 5 },
  { id: "ST12", name: "Pulgaon Junction", code: "PLO", avgScore: 76, safetyPct: 81, highRisk: 1, pointsmenCount: 6 }
];

const INIT_USERS = [
  // Station Masters
  { id: "SM_1001", name: "S. Deshmukh", role: "Station Master", designation: "Station Master", station: "Parbhani Junction", cat: "A", lastAssessDate: "2026-03-20", score: 86, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 11001", joiningDate: "2018-02-12" },
  { id: "SM_2102", name: "A. Kulkarni", role: "Station Master", designation: "Station Master", station: "Parbhani Junction", cat: "B", lastAssessDate: "2026-02-14", score: 72, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 11002", joiningDate: "2019-05-15" },
  { id: "SM_2201", name: "M. Patil", role: "Station Master", designation: "Station Master", station: "Amla Junction", cat: "A", lastAssessDate: "2026-03-12", score: 84, pmeStatus: "Fit", refStatus: "Pending", contact: "+91 98765 11003", joiningDate: "2016-08-20" },
  { id: "SM_2202", name: "R. Sharma", role: "Station Master", designation: "Station Master", station: "Amla Junction", cat: "C", lastAssessDate: "2026-01-30", score: 54, pmeStatus: "Pending", refStatus: "Pending", contact: "+91 98765 11004", joiningDate: "2021-10-10" },
  { id: "SM_2301", name: "V. Singh", role: "Station Master", designation: "Station Master", station: "Badnera Junction", cat: "A", lastAssessDate: "2026-03-15", score: 88, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 11005", joiningDate: "2015-04-12" },
  { id: "SM_2302", name: "T. Mehta", role: "Station Master", designation: "Station Master", station: "Badnera Junction", cat: "B", lastAssessDate: "2026-02-20", score: 71, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 11006", joiningDate: "2020-03-18" },
  { id: "SM_2401", name: "K. Raghuvanshi", role: "Station Master", designation: "Station Master", station: "Nagpur Junction", cat: "A", lastAssessDate: "2026-03-22", score: 92, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 11007", joiningDate: "2014-06-25" },
  { id: "SM_2501", name: "P. Wankhede", role: "Station Master", designation: "Station Master", station: "Akola Junction", cat: "B", lastAssessDate: "2026-03-01", score: 74, pmeStatus: "Overdue", refStatus: "Expired", contact: "+91 98765 11008", joiningDate: "2017-09-08" },
  
  // Pointsmen
  { id: "PM_1001", name: "K. Pawar", role: "Pointsman", designation: "Pointsman Grade I", station: "Parbhani Junction", cat: "A", lastAssessDate: "2026-04-10", score: 80, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 22001", joiningDate: "2020-01-10" },
  { id: "PM_1002", name: "R. Verma", role: "Pointsman", designation: "Pointsman Grade I", station: "Amla Junction", cat: "B", lastAssessDate: "2026-04-09", score: 68, pmeStatus: "Fit", refStatus: "Pending", contact: "+91 98765 22002", joiningDate: "2021-06-18" },
  { id: "PM_1003", name: "D. Rane", role: "Pointsman", designation: "Pointsman Grade II", station: "Amla Junction", cat: "D", lastAssessDate: "2026-04-08", score: 44, pmeStatus: "Unfit", refStatus: "Pending", contact: "+91 98765 22003", joiningDate: "2022-11-22" },
  { id: "PM_1004", name: "J. Shaikh", role: "Pointsman", designation: "Pointsman Grade I", station: "Badnera Junction", cat: "A", lastAssessDate: "2026-04-04", score: 88, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 22004", joiningDate: "2019-12-05" },
  { id: "PM_1005", name: "A. Gade", role: "Pointsman", designation: "Pointsman Grade II", station: "Akola Junction", cat: "C", lastAssessDate: "2026-03-24", score: 58, pmeStatus: "Overdue", refStatus: "Cleared", contact: "+91 98765 22005", joiningDate: "2023-04-15" },
  { id: "PM_1006", name: "S. Meshram", role: "Pointsman", designation: "Pointsman Grade I", station: "Nagpur Junction", cat: "A", lastAssessDate: "2026-03-28", score: 94, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 22006", joiningDate: "2018-05-19" },
  { id: "PM_1007", name: "G. Chawla", role: "Pointsman", designation: "Pointsman Grade II", station: "Itarsi Junction", cat: "A", lastAssessDate: "2026-03-14", score: 82, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 22007", joiningDate: "2020-07-20" },
  { id: "PM_1008", name: "H. Singh", role: "Pointsman", designation: "Pointsman Grade I", station: "Wardha Junction", cat: "B", lastAssessDate: "2026-03-10", score: 76, pmeStatus: "Fit", refStatus: "Expired", contact: "+91 98765 22008", joiningDate: "2017-02-28" },
  { id: "PM_1009", name: "B. Yadav", role: "Pointsman", designation: "Pointsman Grade II", station: "Chandrapur Station", cat: "C", lastAssessDate: "2026-03-05", score: 51, pmeStatus: "Overdue", refStatus: "Pending", contact: "+91 98765 22009", joiningDate: "2022-09-01" },
  { id: "PM_1010", name: "N. Dewangan", role: "Pointsman", designation: "Pointsman Grade I", station: "Gondia Junction", cat: "A", lastAssessDate: "2026-03-18", score: 85, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 22010", joiningDate: "2019-08-11" },
  
  // Station Superintendents
  { id: "SS_1001", name: "S. K. Mukherjee", role: "Station Superintendent", designation: "Station Superintendent", station: "Nagpur Junction", cat: "A", lastAssessDate: "2026-04-14", score: 92, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 33001", joiningDate: "2012-05-18" },
  { id: "SS_1002", name: "H. S. Rawat", role: "Station Superintendent", designation: "Station Superintendent", station: "Parbhani Junction", cat: "A", lastAssessDate: "2026-03-22", score: 89, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 33002", joiningDate: "2013-09-10" },
  { id: "SS_1003", name: "Anand Vardhan", role: "Station Superintendent", designation: "Station Superintendent", station: "Akola Junction", cat: "B", lastAssessDate: "2026-02-18", score: 75, pmeStatus: "Fit", refStatus: "Pending", contact: "+91 98765 33003", joiningDate: "2015-11-05" },

  // Train Managers
  { id: "TM_1001", name: "Dilip Kumar", role: "Train Manager", designation: "Train Manager", station: "Nagpur Junction", cat: "A", lastAssessDate: "2026-04-20", score: 90, pmeStatus: "Fit", refStatus: "Cleared", contact: "+91 98765 44001", joiningDate: "2017-06-12" },
  { id: "TM_1002", name: "Vikas Dubey", role: "Train Manager", designation: "Train Manager", station: "Badnera Junction", cat: "B", lastAssessDate: "2026-03-11", score: 78, pmeStatus: "Fit", refStatus: "Pending", contact: "+91 98765 44002", joiningDate: "2019-10-22" },
  { id: "TM_1003", name: "J. P. Nadda", role: "Train Manager", designation: "Train Manager", station: "Amla Junction", cat: "C", lastAssessDate: "2026-01-25", score: 56, pmeStatus: "Pending", refStatus: "Expired", contact: "+91 98765 44003", joiningDate: "2021-04-15" }
];

const TEST_NAME = "Station Superintendent Periodic Assessment";

const rawQuestions = [
  { text: "Who is the primary authority responsible for verifying and signing the Station Working Rules (SWR) correction slips?", options: ["The Senior Section Engineer (Signal)", "The Station Superintendent and Senior DOM", "The AOM/G on duty", "The Chief Track Inspector"], answer: 1, explanation: "The Station Superintendent, along with the Senior Divisional Operations Manager (DOM), holds joint responsibility for signing and implementing SWR correction slips at the station yard limits." },
  { text: "During non-interlocked working for yard remodeling, what is the most critical duty of the Station Superintendent?", options: ["Delegating all route setup to pointsmen", "Personally supervising correct line setup, clamping, and padlocking of points", "Increasing train speed to clear congestion", "Suspending all communications with adjacent stations"], answer: 1, explanation: "Non-interlocked working is highly safety-critical. The Station Superintendent must personally ensure points are set, clamped, and padlocked before authorizing movements." },
  { text: "If a train passes a reception signal at danger (SPAD) inside station limits, what immediate action must the Station Superintendent take?", options: ["Direct the driver to proceed immediately to avoid delay", "Log the incident and instruct the SM on duty to protect the line and inform Control", "Quietly replace the signal bulb", "Blame the station superintendent on duty"], answer: 1, explanation: "SPAD is a major incident. The SS must ensure the line is immediately protected, the incident is logged, and the Divisional Control/Safety officer is notified." },
  { text: "In the event of a fire in the station control room, what is the first priority for the Station Superintendent?", options: ["Call the railway division headquarters for permission to evacuate", "Evacuate staff, use portable CO2 extinguishers, and isolate power supplies", "Protect physical files first", "Run out to the platform to check train schedules"], answer: 1, explanation: "The first priority in case of fire is life safety, followed by utilizing fire fighting equipment and isolating the electric/traction supply." },
  { text: "Who is responsible for supervising the shunting of passenger coaches containing passengers?", options: ["Any Station Superintendent", "The Station Superintendent or AOM/G on duty", "The Train Guard only", "The Coach Attendant"], answer: 1, explanation: "Shunting of occupied passenger vehicles must be personally supervised by the SS or the AOM/G on duty to prevent casualties." },
  { text: "If a AOM/G on duty is observed showing severe signs of fatigue or illness, the Station Superintendent must:", options: ["Instruct them to complete the shift anyway", "Arrange immediate relief and ensure the SM does not perform active block operations", "Give them strong coffee and ignore it", "Report them for misconduct"], answer: 1, explanation: "Active block operations require high alertness. Operating under fatigue/illness is a major safety hazard; relief must be arranged immediately." },
  { text: "In single-line token block working, what must the SS verify regarding token custody?", options: ["Tokens can be left on the counter", "Tokens must be secured in the block instrument and handled only by authorized staff", "Any passenger can hand over the token", "Drivers can carry multiple tokens"], answer: 1, explanation: "Safety tokens represent block authority and must remain secured inside block instruments under lock and key." },
  { text: "When a passing train is reported to have a 'Hot Axle' by the gateman, what must the Station Superintendent ensure?", options: ["The train is allowed to proceed to destination", "The train is stopped immediately at the station and the hot axle wagon is detached", "The train is speeded up to cool down the axle", "Instruct the driver to turn off the alarm"], answer: 1, explanation: "A hot axle can cause derailment. The train must be stopped at the station immediately, examined, and the defective wagon detached." },
  { text: "Before authorizing a Track Maintenance Block (Traffic Block) for the P-Way team, what is required?", options: ["A verbal nod from the driver", "A signed block permit exchanged between the SS/SM on duty and the block applicant", "No formal paperwork is required", "A general announcement on the platform"], answer: 1, explanation: "Track block working requires strict adherence to physical block permits, exchange of private numbers, and physical block protection." },
  { text: "A large parcel has fallen onto the track of Platform 3. The SS must immediately:", options: ["Wait for the scheduled cleaning staff", "Instruct the SM to set the signals to 'Red' for Platform 3 and clear the track", "Let the next incoming train push the parcel away", "Move it after the next train passes"], answer: 1, explanation: "Any track obstruction must be protected immediately by setting signals to danger/on and verifying the obstruction is cleared." },
  { text: "If water rises above rail level at the station yard, what action should the SS coordinate?", options: ["Allow trains to pass at normal speed", "Stop train movements or restrict speed to walking pace under direct engineering guidance", "Turn off all station lights", "Drain water onto the adjacent highway"], answer: 1, explanation: "Water logging reduces track stability and obscures points. Train movements must be stopped or restricted under track engineer supervision." },
  { text: "A passenger collapses on Platform 2 with severe chest pain. What is the SS's protocol?", options: ["Ask the passenger to take a taxi to the hospital", "Call the railway doctor, summon local ambulance, and administer basic first aid", "Tell them to wait for the next train", "Do nothing unless they are railway staff"], answer: 1, explanation: "The SS is responsible for arranging immediate medical aid, coordinating with local ambulances, and contacting the nearest railway hospital." },
  { text: "A freight train halts at the station. Before clearing the signal for an adjacent line train, the SS must verify:", options: ["The freight train is painted clean", "The rear vehicle of the freight train has completely cleared the fouling mark", "The freight driver has signed the logbook", "The passenger platform is empty"], answer: 1, explanation: "A train must stand completely clear of the fouling mark to prevent side-swipe collisions with trains on adjacent lines." },
  { text: "How often should the Station Superintendent conduct mock fire drills at the station?", options: ["Once in 3 years", "Jointly with fire services every 3 months or as per division rules", "Only when a fire occurs", "Never, it is not required"], answer: 1, explanation: "Periodic safety audits and mock drills (fire, emergency evacuation) are mandatory to ensure staff preparedness." },
  { text: "Under what condition can a driver pass a semi-automatic signal at 'Danger' within station limits?", options: ["On verbal instructions over walkie-talkie", "On receiving a physical Authority Memo (T/369-3b) and verifying points are correctly set", "When they are running late", "If the signal flashes yellow"], answer: 1, explanation: "Passing a signal at danger requires strict physical authorization (T/369-3b) and verifying the route is locked and clear." },
  { text: "To prevent stabled wagons from rolling back or moving, what must the SS ensure?", options: ["Hand brakes are fully applied, safety chains locked, and wooden wedges placed under wheels", "Points are kept unlocked", "A station superintendent stands behind the wagon", "Nothing, wagons cannot move on their own"], answer: 0, explanation: "Securing stabled loads requires full handbrake application, safety chains, and wooden wedges/skids to prevent runaway movements." },
  { text: "When exhibiting a hand signal to a pilot, where should the station staff stand?", options: ["Directly between the rails", "In a safe, highly visible position clear of the tracks", "On top of the cabin", "Inside the station master's office"], answer: 1, explanation: "Personal safety is key. Staff must stand in a safe, visible location, clear of track suction or vehicle overhang." },
  { text: "A signal is bobbing (randomly changing aspects). What must the SS instruct the SM on duty to do?", options: ["Ignore it until it stabilizes", "Treat it as showing its most restrictive aspect (Stop/Red) and report the defect immediately", "Turn off the signal power", "Tell the driver to speed through"], answer: 1, explanation: "Any fluctuating or bobbing signal must be treated as a danger/restrictive signal for safety." },
  { text: "Where should the emergency point chain keys and interlocking override keys be stored?", options: ["In the station superintendent's personal locker", "In a sealed glass box under the joint custody of the Station Superintendent/Master on duty", "Left in the keyholes at all times", "In the station manager's car"], answer: 1, explanation: "Safety critical keys must remain under strict custody in a secure box to prevent unauthorized operations." },
  { text: "If a Station Superintendent's PME is overdue by even one day, the Station Superintendent must:", options: ["Allow them to work shunting duties today anyway", "Strictly pull them off safety-related duties and send them for medical evaluation", "Extend their medical fitness verbally", "Let them work night shifts only"], answer: 1, explanation: "Safety rules forbid any staff with overdue PME from performing active safety-critical railway duties." },
  { text: "A train passes with its rear brake van missing. The SS/SM on duty must immediately:", options: ["Close the block section and alert adjacent stations and control of train parting", "Let the train proceed to destination", "Call a track maintenance worker", "Wave a green flag at the next train"], answer: 0, explanation: "A missing brake van indicates a train parting. The block section must be closed and adjacent stations notified to prevent rear-end collisions." },
  { text: "Where must safety detonators be stored at the station?", options: ["In a damp basement", "In a dry, locked metallic tin box away from heat and moisture", "On the open booking office shelf", "In the staff dining room"], answer: 1, explanation: "Detonators contain explosives and must be stored in dry, secure metallic boxes to prevent deterioration." },
  { text: "How often should safety briefings be held for the station staff under the SS's oversight?", options: ["Once a year during inspections", "Daily or before shift handovers to discuss SWR highlights and safe operations", "Only after a major accident", "Bi-annually"], answer: 1, explanation: "Shift-level safety briefings keep rules fresh and prevent complacency among station masters and ground crew." },
  { text: "When block instruments fail on a double line section, what block system must be adopted?", options: ["Line Clear Ticket / Paper Line Clear Working under SWR guidance", "Automatic block working without permission", "Stop all trains indefinitely", "Follow the train ahead closely"], answer: 0, explanation: "Block instrument failure requires transitioning to Paper Line Clear Ticket working, adhering strictly to SWR manual block procedures." },
  { text: "A AOM/G has missed their scheduled safety refresher course training. The SS must:", options: ["Allow them to continue active duty", "Take them off block operations duties immediately until retraining is completed", "Give them a handbook to read on shift", "Exempt them under station authority"], answer: 1, explanation: "Retraining is a statutory safety requirement. Staff with expired refresher training cannot operate block consoles." }
];

const testQuestions = rawQuestions.map((q, i) => ({ id: i + 1, ...q }));

function generateMockResponses(totalScore) {
  const correctCount = Math.round(totalScore / 4);
  const responses = Array(25).fill(null);
  const correctIndices = new Set();
  while (correctIndices.size < correctCount) {
    correctIndices.add(Math.floor(Math.random() * 25));
  }
  responses.forEach((_, i) => {
    if (correctIndices.has(i)) {
      responses[i] = testQuestions[i].answer;
    } else {
      const wrong = (testQuestions[i].answer + 1 + Math.floor(Math.random() * 3)) % testQuestions[i].options.length;
      responses[i] = wrong;
    }
  });
  return responses;
}

const initialHistory = [];

export { INIT_STATIONS, INIT_USERS, TEST_NAME, rawQuestions, testQuestions, initialHistory, generateMockResponses };
