CREATE OR REPLACE VIEW judge_submission_ranks AS
SELECT 
    e.submission_id,
    e.judge_id,
    ec.stage_id,
    SUM(e.score * (ec.weight / 100)) AS avg_judge, 
    RANK() OVER(PARTITION BY e.judge_id, ec.stage_id ORDER BY SUM(e.score * (ec.weight / 100)) DESC) AS judge_rank
FROM evaluations e
JOIN evaluation_criteria ec ON e.criteria_id = ec.criteria_id
GROUP BY e.submission_id, e.judge_id, ec.stage_id;