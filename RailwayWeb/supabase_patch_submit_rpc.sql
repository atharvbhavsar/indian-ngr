-- =========================================================================================
-- DATABASE MIGRATION: CREATE submit_test_attempt_rpc & ADD answers COLUMN
-- Resolves assessment submissions and enforces transactional integrity.
-- =========================================================================================

-- 1. Ensure the answers JSONB column exists on TEST_ATTEMPT to support checklist & metadata storage
ALTER TABLE "TEST_ATTEMPT" ADD COLUMN IF NOT EXISTS "answers" JSONB;

-- 2. Create or replace the atomic submission RPC procedure
CREATE OR REPLACE FUNCTION public.submit_test_attempt_rpc(
  p_employee_id UUID,
  p_assessment_id UUID,
  p_total_marks INT,
  p_obtained_marks INT,
  p_percentage DECIMAL,
  p_category VARCHAR,
  p_conducted_by UUID,
  p_answers JSONB
) RETURNS TABLE (
  attempt_id UUID,
  assessment_id UUID
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_attempt_id UUID;
  v_retest_assess_id UUID;
  ans RECORD;
BEGIN
  -- 1. Update parent assessment status to Submitted and conducted_by
  IF p_assessment_id IS NOT NULL THEN
    UPDATE "ASSESSMENT"
    SET status = 'Submitted',
        conducted_by = p_conducted_by,
        assessment_date = CURRENT_DATE
    WHERE "ASSESSMENT".assessment_id = p_assessment_id;
  END IF;

  -- 2. Check if attempt already exists for this assessment
  IF p_assessment_id IS NOT NULL THEN
    SELECT "TEST_ATTEMPT".attempt_id INTO v_attempt_id 
    FROM "TEST_ATTEMPT" 
    WHERE "TEST_ATTEMPT".assessment_id = p_assessment_id 
    LIMIT 1;
  END IF;

  -- 3. Insert or Update the TEST_ATTEMPT record with answers JSONB
  IF v_attempt_id IS NOT NULL THEN
    UPDATE "TEST_ATTEMPT" 
    SET total_marks = p_total_marks,
        obtained_marks = p_obtained_marks,
        percentage = p_percentage,
        category = p_category,
        answers = p_answers,
        submitted_at = CURRENT_TIMESTAMP
    WHERE "TEST_ATTEMPT".attempt_id = v_attempt_id;

    -- Delete existing answer history if it's an update to prevent duplicates
    DELETE FROM "ANSWER_HISTORY" WHERE "ANSWER_HISTORY".attempt_id = v_attempt_id;
  ELSE
    INSERT INTO "TEST_ATTEMPT" (assessment_id, employee_id, total_marks, obtained_marks, percentage, category, answers, started_at, submitted_at)
    VALUES (p_assessment_id, p_employee_id, p_total_marks, p_obtained_marks, p_percentage, p_category, p_answers, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING "TEST_ATTEMPT".attempt_id INTO v_attempt_id;
  END IF;

  -- 4. Bulk insert answers from JSON array if provided (MCQs)
  IF p_answers IS NOT NULL AND jsonb_typeof(p_answers) = 'array' THEN
    FOR ans IN SELECT * FROM jsonb_to_recordset(p_answers) AS x(
      "questionId" INT, "selectedOption" CHAR, "isCorrect" BOOLEAN, "correctOption" CHAR, "marksObtained" INT
    ) LOOP
      INSERT INTO "ANSWER_HISTORY" (attempt_id, question_id, selected_option, is_correct, correct_option, marks_obtained)
      VALUES (v_attempt_id, ans."questionId", ans."selectedOption", ans."isCorrect", ans."correctOption", ans."marksObtained");
    END LOOP;
  END IF;

  -- 5. --- OFFICIAL BUSINESS LOGIC: CATEGORY D AUTO-TRIGGER ---
  IF p_category = 'D' OR p_obtained_marks < 50 THEN
    -- 5a. Create a COUNSELLING_RECORD
    INSERT INTO "COUNSELLING_RECORD" (user_id, assessment_id, counsellor_id, remarks, status)
    VALUES (p_employee_id, p_assessment_id, p_conducted_by, 'System Auto-Generated: Score was ' || p_obtained_marks || '%. Category D: Immediate safety counselling required.', 'Pending');

    -- 5b. Create a new locked assessment for the retest
    INSERT INTO "ASSESSMENT" (employee_id, conducted_by, assessment_type, due_date, status)
    VALUES (p_employee_id, p_conducted_by, 'Mandatory Retest (Category D)', CURRENT_DATE + INTERVAL '1 month', 'LOCKED')
    RETURNING "ASSESSMENT".assessment_id INTO v_retest_assess_id;

    -- 5c. Insert into RETEST_SCHEDULING table linking original and retest assessments
    INSERT INTO "RETEST_SCHEDULING" (employee_id, original_assessment_id, retest_assessment_id, scheduled_date, status)
    VALUES (p_employee_id, p_assessment_id, v_retest_assess_id, CURRENT_DATE + INTERVAL '1 month', 'Scheduled');

    -- 5d. Update Profile to High Risk monitoring status & Category D
    UPDATE "EMPLOYEE_PROFILE"
    SET monitoring_status = 'High Risk',
        category = 'D',
        current_score = p_obtained_marks
    WHERE user_id = p_employee_id;

    -- 5e. Update MONITORING table risk level
    INSERT INTO "MONITORING" (user_id, monitoring_status, risk_level, remarks, updated_at)
    VALUES (p_employee_id, 'Under Observation', 'High', 'Automated high risk observation triggered after scoring ' || p_obtained_marks || '% (Category D) on assessment.', CURRENT_TIMESTAMP)
    ON CONFLICT (user_id) DO UPDATE
    SET monitoring_status = EXCLUDED.monitoring_status,
        risk_level = EXCLUDED.risk_level,
        remarks = EXCLUDED.remarks,
        updated_at = CURRENT_TIMESTAMP;

    -- 5f. Generate Notification for Employee
    INSERT INTO "NOTIFICATION" (user_id, title, message, is_read)
    VALUES (p_employee_id, 'Mandatory Counselling & Retest Scheduled', 'You have scored Category D (' || p_obtained_marks || '%). Mandatory safety counselling has been scheduled, your profile is marked as High Risk, and a retest is scheduled in 1 month.', FALSE);

    -- 5g. Generate Notification for Evaluator/Supervisor
    IF p_conducted_by IS NOT NULL AND p_conducted_by <> p_employee_id THEN
      INSERT INTO "NOTIFICATION" (user_id, title, message, is_read)
      VALUES (p_conducted_by, 'Category D Safety Warning: Employee graded D', 'Safety Alert: Employee graded Category D with score of ' || p_obtained_marks || '%. Counselling and high-risk monitoring protocols have been automatically triggered.', FALSE);
    END IF;

    -- 5h. Write to Audit Log
    INSERT INTO "AUDIT_LOG" (user_id, action, table_name, record_id)
    VALUES (p_conducted_by, 'CATEGORY_D_AUTO_TRIGGER', 'TEST_ATTEMPT', v_attempt_id::text);
  END IF;

  RETURN QUERY SELECT v_attempt_id, p_assessment_id;
END;
$$;
