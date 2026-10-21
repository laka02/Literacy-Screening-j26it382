"""
CAIRE - Adaptive Intervention Planning & Progress Tracking
Draft prototype rules for teacher/expert review.

These are illustrative rules, not officially validated educational standards.
"""

RULES = {
    "R01": "Score below 45: consider foundational activities.",
    "R02": "Score 45-74: consider guided practice.",
    "R03": "Score 75 or above: consider a suitable challenge activity.",
    "R04": "Apply R01-R03 to writing performance.",
    "R05": "Apply R01-R03 to speaking performance.",
    "R06": "Apply R01-R03 to vocabulary performance.",
    "R07": "Use the selected skill's score when choosing an activity.",
    "R08": "Use simple, age-appropriate activity instructions.",
    "R09": "Prefer supported practice when a learner needs more help.",
    "R10": "Increase difficulty gradually when performance improves.",
    "R11": "Avoid assuming a high score means every skill is strong.",
    "R12": "Assess each skill separately before selecting activities.",

    "R13": "Review multiple skill scores to identify support priorities.",
    "R14": "Compare the current score with the previous score.",
    "R15": "Consider extra practice when a score decreases.",
    "R16": "Consider progression when scores improve consistently.",
    "R17": "Look for repeated errors before choosing remedial practice.",
    "R18": "Consider hints used when reviewing activity performance.",
    "R19": "Do not use hints alone to determine support priority.",
    "R20": "Consider repeated attempts when reviewing progress.",
    "R21": "Use shorter activities when a learner appears to need them.",
    "R22": "Offer picture or audio support where appropriate.",
    "R23": "Provide clear, child-friendly feedback.",
    "R24": "Avoid overwhelming learners with too many instructions.",
    "R25": "Adapt the next activity using recorded progress.",
    "R26": "Reassess a skill after targeted practice.",
    "R27": "Track progress across multiple sessions.",
    "R28": "Do not treat one low score as a diagnosis.",
    "R29": "Consider engagement data only when it is available.",
    "R30": "Offer low-bandwidth alternatives where feasible.",

    "R31": "Treat English as an additional language when relevant.",
    "R32": "Use Sinhala or Tamil explanations only when approved.",
    "R33": "Use familiar Sri Lankan contexts in learning activities.",
    "R34": "Keep activity content appropriate for the learner's age.",
    "R35": "Check grade-level suitability before recommending activities.",
    "R36": "Align activities with the curriculum when verified materials exist.",
    "R37": "Use only activities available in the approved activity catalogue.",
    "R38": "Refer unsupported cases for teacher review.",
    "R39": "Allow teachers to review and adjust suggested plans.",
    "R40": "Record the reason for each support recommendation.",
}


def classify_performance(score):
    """Illustrative performance band; thresholds require expert review."""
    if score is None:
        return "unknown"

    score = float(score)

    if not 0 <= score <= 100:
        raise ValueError("Score must be between 0 and 100.")

    if score < 45:
        return "low"
    elif score < 75:
        return "medium"
    return "high"


def get_support_priority(score):
    """Keep support priority separate from performance category."""
    band = classify_performance(score)

    return {
        "low": "high",
        "medium": "moderate",
        "high": "routine",
        "unknown": "needs_assessment",
    }[band]


def evaluate_skill(score, previous_score=None):
    """Return a basic, explainable prototype recommendation."""
    band = classify_performance(score)
    priority = get_support_priority(score)

    result = {
        "performance_band": band,
        "support_priority": priority,
        "reason": [],
        "rules_applied": [],
    }

    if band == "unknown":
        result["reason"].append("A valid score is needed.")
        return result

    result["rules_applied"].append(
        {"low": "R01", "medium": "R02", "high": "R03"}[band]
    )

    if band == "low":
        result["suggested_activity_type"] = "foundational_supported_practice"
        result["reason"].append(
            "The score suggests considering foundational supported practice."
        )
    elif band == "medium":
        result["suggested_activity_type"] = "guided_practice"
        result["reason"].append(
            "The score suggests considering guided practice."
        )
    else:
        result["suggested_activity_type"] = "progressive_challenge"
        result["reason"].append(
            "The score suggests considering a suitable challenge activity."
        )

    if previous_score is not None:
        previous_score = float(previous_score)

        if not 0 <= previous_score <= 100:
            raise ValueError("Previous score must be between 0 and 100.")

        change = float(score) - previous_score
        result["score_change"] = round(change, 2)
        result["rules_applied"].append("R14")

        if change < 0:
            result["reason"].append(
                "The score decreased; review the learner's recent work."
            )
            result["rules_applied"].append("R15")
        elif change > 0:
            result["reason"].append(
                "The score improved; monitor progress in the next session."
            )
            result["rules_applied"].append("R16")

    result["reason"].append(
        "A teacher should review the recommendation before classroom use."
    )

    return result


def generate_adaptive_plan(skill_type: str, current_score: float, previous_score: float = None, grade: str = "4"):
    """
    Generate a 3-stage adaptive adventure roadmap for Grade 3-5 children based on expert rules.
    - Stage 1: Easy / Foundational (warm-up at learner's comfortable entry point)
    - Stage 2: Guided Practice (core practice target)
    - Stage 3: Gentle Challenge (stretch goal to stimulate cognitive progression)
    """
    evaluation = evaluate_skill(current_score, previous_score)
    band = evaluation["performance_band"]

    # Skill-specific configurations with animal guides & Sri Lankan child themes
    skill_meta = {
        "writing": {
            "title": "Writing",
            "guide": "Leo the Lion 🦁",
            "color": "#16a34a",
            "icon": "draw",
            "rule_tag": "R04",
        },
        "reading": {
            "title": "Reading",
            "guide": "Ruby the Deer 🦌",
            "color": "#7c3aed",
            "icon": "auto_stories",
            "rule_tag": "R07",
        },
        "speaking": {
            "title": "Speaking",
            "guide": "Oliver the Owl 🦉",
            "color": "#ea580c",
            "icon": "record_voice_over",
            "rule_tag": "R05",
        },
        "listening": {
            "title": "Listening",
            "guide": "Barnaby the Bear 🐻",
            "color": "#0284c7",
            "icon": "hearing",
            "rule_tag": "R06",
        },
        "vocabulary": {
            "title": "Listening",
            "guide": "Barnaby the Bear 🐻",
            "color": "#0284c7",
            "icon": "hearing",
            "rule_tag": "R06",
        },
    }

    selected_skill = skill_type.lower()
    if selected_skill not in skill_meta:
        selected_skill = "reading"

    meta = skill_meta[selected_skill]
    evaluation["rules_applied"].append(meta["rule_tag"])
    evaluation["rules_applied"].extend(["R08", "R10", "R22", "R23", "R33", "R34", "R35"])

    # Adaptive 3-Stage Plan Generation
    if selected_skill == "writing":
        # Rule evaluation for Writing:
        # Score < 45: R01, R04, R08, R09 (Foundational letter tracing A-Z, stroke physics)
        # Score 45-74: R02, R04, R10, R22 (Guided letter formation, word blends)
        # Score >= 75: R03, R04, R16, R25 (Challenge word flow, sentence writing)
        if band == "low":
            evaluation["rules_applied"].extend(["R01", "R04", "R08", "R09", "R21", "R22"])
            stage1_title = "Stage 1: Letter Quest — Practice 'B' (A–Z Tracing)"
            stage1_diff = "Foundational (Letter Tracing)"
            stage1_desc = "Trace capital 'B' and lowercase 'b' along handwriting guide lines with stroke arrows."
            stage1_rules = ["R01", "R04", "R08", "R09", "R21", "R22"]
            stage1_letter = "B"
            stage1_lower = "b"
            stage1_sound = "/b/ as in Bear & Butterfly 🐻"
            stage1_hint = "Start from the top dot and trace down straight to the bottom! ✏️"
        elif band == "medium":
            evaluation["rules_applied"].extend(["R02", "R04", "R08", "R10", "R22"])
            stage1_title = "Stage 1: Letter Quest — Practice 'B' (Stroke Precision)"
            stage1_diff = "Guided Practice (Letter Formation)"
            stage1_desc = "Master the curve radius and straight spine alignment of letter 'B' to avoid reversals."
            stage1_rules = ["R02", "R04", "R08", "R10", "R22"]
            stage1_letter = "B"
            stage1_lower = "b"
            stage1_sound = "/b/ as in Boat & Bird ⛵"
            stage1_hint = "Make the top loop first, then round out the bottom loop smoothly!"
        else:
            evaluation["rules_applied"].extend(["R03", "R04", "R10", "R16"])
            stage1_title = "Stage 1: Letter Quest — Fast & Fluent Tracing"
            stage1_diff = "Proficient (Stroke Agility)"
            stage1_desc = "Trace clean letterforms with consistent handwriting slant and pencil stamina."
            stage1_rules = ["R03", "R04", "R10", "R16"]
            stage1_letter = "B"
            stage1_lower = "b"
            stage1_sound = "/b/ as in Brave & Brilliant ⭐"
            stage1_hint = "Keep a steady, relaxed grip and trace without pausing mid-curve!"

        stages = [
            {
                "stage_number": 1,
                "title": stage1_title,
                "difficulty": stage1_diff,
                "description": stage1_desc,
                "rules": stage1_rules,
                "xp_reward": 50,
                "stars": 3,
                "locked": False,
                "status": "Ready",
                "task_data": {
                    "type": "writing_trace",
                    "letter": stage1_letter,
                    "letter_lower": stage1_lower,
                    "phonics_sound": stage1_sound,
                    "word_example": "Bear",
                    "letter_number": 2,
                    "total_letters": 26,
                    "letters_set": [
                        "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
                        "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
                    ],
                    "stroke_steps": [
                        {"step": 1, "instruction": "Top-to-bottom straight spine", "icon": "arrow_downward", "color": "#3b82f6"},
                        {"step": 2, "instruction": "Top curve to midline", "icon": "turn_right", "color": "#f97316"},
                        {"step": 3, "instruction": "Bottom curve to baseline", "icon": "turn_right", "color": "#eab308"}
                    ],
                    "hint": stage1_hint,
                    "question": f"Letter Quest: Practice tracing uppercase '{stage1_letter}' and lowercase '{stage1_lower}'",
                    "options": ["Trace Letter 'B'", "Listen to Sound /b/", "Clear & Retry"],
                    "correct_index": 0
                }
            },
            {
                "stage_number": 2,
                "title": "Stage 2: Word Quest — Blends & Sight Words ('BAT')",
                "difficulty": "Moderate (Word Formation)",
                "description": "Combine learned letters into 3-letter words with correct letter spacing.",
                "rules": ["R02", "R08", "R10", "R22", "R23"],
                "xp_reward": 75,
                "stars": 3,
                "locked": True,
                "status": "Locked",
                "task_data": {
                    "type": "writing_trace",
                    "letter": "BAT",
                    "letter_lower": "bat",
                    "phonics_sound": "/b-æ-t/ as in Cricket Bat 🏏",
                    "word_example": "Bat",
                    "letter_number": 2,
                    "total_letters": 5,
                    "letters_set": ["BAT", "BALL", "BOOK", "BIRD", "BELL"],
                    "stroke_steps": [
                        {"step": 1, "instruction": "Trace letter B", "icon": "draw", "color": "#3b82f6"},
                        {"step": 2, "instruction": "Trace letter A", "icon": "draw", "color": "#f97316"},
                        {"step": 3, "instruction": "Trace letter T", "icon": "draw", "color": "#16a34a"}
                    ],
                    "hint": "Leave a tiny finger-space between each letter so words are easy to read! 📏",
                    "question": "Word Quest: Practice writing the word 'BAT'",
                    "options": ["bat", "tab", "cat"],
                    "correct_index": 0
                }
            },
            {
                "stage_number": 3,
                "title": "Stage 3: Sentence Quest — Flow & Baseline Alignment",
                "difficulty": "Challenge (Sentence Mastery)",
                "description": "Write a complete Sri Lankan adventure sentence with neat capital letters and punctuation.",
                "rules": ["R03", "R10", "R16", "R25", "R33"],
                "xp_reward": 100,
                "stars": 3,
                "locked": True,
                "status": "Locked",
                "task_data": {
                    "type": "writing_trace",
                    "letter": "The Bear plays ball.",
                    "letter_lower": "the bear plays ball.",
                    "phonics_sound": "Fluent sentence writing challenge 🦁",
                    "word_example": "The Bear plays ball.",
                    "letter_number": 1,
                    "total_letters": 3,
                    "letters_set": ["The Bear plays ball.", "Birds fly high.", "Brave lions roar."],
                    "stroke_steps": [
                        {"step": 1, "instruction": "Start with Capital Letter", "icon": "format_size", "color": "#3b82f6"},
                        {"step": 2, "instruction": "Keep letters on baseline", "icon": "horizontal_rule", "color": "#f97316"},
                        {"step": 3, "instruction": "End with a full stop", "icon": "fiber_manual_record", "color": "#16a34a"}
                    ],
                    "hint": "Make sure your letters sit right on the bottom baseline! 🏰",
                    "question": "Sentence Quest: Write the sentence 'The Bear plays ball.' neatly on the lines.",
                    "options": [
                        "The Bear plays ball.",
                        "Bear the ball plays.",
                        "The plays bear ball."
                    ],
                    "correct_index": 0
                }
            }
        ]
    else:
        # Generic 3-Stage Adventure Plan for other skills
        stages = [
            {
                "stage_number": 1,
                "title": f"Stage 1: {meta['guide'].split()[0]}'s Warm-up Safari",
                "difficulty": "Easy (Foundational)",
                "description": "Start with friendly illustrated warm-ups with audio hints and visual guides.",
                "rules": ["R01", "R08", "R09", "R22"],
                "xp_reward": 50,
                "stars": 3,
                "locked": False,
                "status": "Ready",
                "task_data": {
                    "question": f"Grade {grade} Warm-up: Identify the correct match for the illustrated clue.",
                    "hint": "Listen carefully to the first sound and look at the picture clue! 🌿",
                    "options": ["Sun ☀️", "Moon 🌙", "Star ⭐"],
                    "correct_index": 0,
                }
            },
            {
                "stage_number": 2,
                "title": "Stage 2: River Crossing Adventure",
                "difficulty": "Moderate (Guided Practice)",
                "description": "Practice sentence rhythm and word blend precision with guided clues.",
                "rules": ["R02", "R10", "R18", "R23"],
                "xp_reward": 75,
                "stars": 3,
                "locked": True,
                "status": "Locked",
                "task_data": {
                    "question": f"Grade {grade} Guided Step: Complete the sentence using the right action word.",
                    "hint": "Think about what birds do in the blue sky! 🕊️",
                    "options": ["swim", "fly high", "crawl"],
                    "correct_index": 1,
                }
            },
            {
                "stage_number": 3,
                "title": "Stage 3: Cloud Castle Challenge",
                "difficulty": "Challenge (Mastery Stretch)",
                "description": "Unlock the golden treasure chest with an advanced fluency and expression test!",
                "rules": ["R03", "R10", "R16", "R25"],
                "xp_reward": 100,
                "stars": 3,
                "locked": True,
                "status": "Locked",
                "task_data": {
                    "question": f"Grade {grade} Champion Challenge: Pick the sentence with perfect phrasing and rhythm.",
                    "hint": "Read smoothly without long pauses between words! 🏰",
                    "options": [
                        "The gentle deer drank sweet water by the lake.",
                        "The drank gentle deer sweet by water.",
                        "Deer gentle the water sweet lake."
                    ],
                    "correct_index": 0,
                }
            }
        ]

    return {
        "skill": selected_skill,
        "meta": meta,
        "evaluation": evaluation,
        "grade": grade,
        "current_score": current_score,
        "previous_score": previous_score,
        "stages": stages,
        "rules_manifest": [
            {"code": r, "description": RULES.get(r, "")} for r in set(evaluation["rules_applied"])
        ]
    }
