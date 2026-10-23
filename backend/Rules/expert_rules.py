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


import os
from pathlib import Path

# ─────────────────────────────────────────────────────────────────────────────
# ML MODEL INTEGRATION (Trained Random Forest Classifier)
# ─────────────────────────────────────────────────────────────────────────────
_ML_MODEL = None
_ML_MODEL_PATH = Path(__file__).resolve().parent.parent.parent / "ml_model" / "caire_random_forest_demo.joblib"


def get_ml_model():
    """Load the pre-trained Random Forest model (pipeline with preprocessor & classifier)."""
    global _ML_MODEL
    if _ML_MODEL is None and _ML_MODEL_PATH.exists():
        try:
            import joblib
            _ML_MODEL = joblib.load(_ML_MODEL_PATH)
            print(f"[ML INFERENCE] Successfully loaded trained Random Forest model from {_ML_MODEL_PATH}")
        except Exception as err:
            print(f"[ML INFERENCE ERROR] Could not load joblib model: {err}")
            _ML_MODEL = False
    return _ML_MODEL if _ML_MODEL is not False else None


def predict_support_priority_ml(
    skill_type: str = "writing",
    current_score: float = 40.0,
    previous_score: float = None,
    scores_dict: dict = None,
    attempts: int = 1,
    hints_used: int = 0
):
    """
    Run real-time inference using the trained Random Forest Classifier.
    Predicts: 'high', 'medium', 'low' support priority based on student's performance features.
    """
    model = get_ml_model()
    if model is None:
        return get_support_priority(current_score)

    try:
        import pandas as pd
        
        # Extract individual screening skill scores
        w_score = float(scores_dict.get("writing", current_score if skill_type == "writing" else 40)) if scores_dict else float(current_score)
        s_score = float(scores_dict.get("speaking", current_score if skill_type == "speaking" else 40)) if scores_dict else float(current_score)
        v_score = float(scores_dict.get("vocabulary", scores_dict.get("listening", 40))) if scores_dict else 40.0
        
        prev = float(previous_score) if previous_score is not None else float(current_score)
        score_diff = float(current_score) - prev

        # Prepare exact feature row matching training data schema
        features_df = pd.DataFrame([{
            "writing_score": w_score,
            "speaking_score": s_score,
            "vocabulary_score": v_score,
            "target_skill": str(skill_type).lower(),
            "target_skill_score": float(current_score),
            "previous_target_skill_score": prev,
            "attempts": int(attempts or 1),
            "hints_used": int(hints_used or 0),
            "score_change": score_diff
        }])

        prediction = model.predict(features_df)[0]
        print(f"[ML INFERENCE] Random Forest predicted support_priority='{prediction}' for skill='{skill_type}' (Score: {current_score})")
        return str(prediction)
    except Exception as e:
        print(f"[ML INFERENCE ERROR] Fallback to expert rules: {e}")
        return get_support_priority(current_score)


def get_support_priority(score):
    """Keep support priority separate from performance category."""
    band = classify_performance(score)

    return {
        "low": "high",
        "medium": "moderate",
        "high": "routine",
        "unknown": "needs_assessment",
    }[band]


def evaluate_skill(
    score,
    previous_score=None,
    skill_type="writing",
    scores_dict=None,
    attempts=1,
    hints_used=0
):
    """Return an explainable recommendation combining ML model inference with expert rules."""
    band = classify_performance(score)
    
    # Predict support priority using trained Random Forest model
    ml_priority = predict_support_priority_ml(
        skill_type=skill_type,
        current_score=score,
        previous_score=previous_score,
        scores_dict=scores_dict,
        attempts=attempts,
        hints_used=hints_used
    )
    rule_priority = get_support_priority(score)
    priority = ml_priority if ml_priority else rule_priority

    result = {
        "performance_band": band,
        "support_priority": priority,
        "ml_model_applied": "RandomForestClassifier (caire_random_forest_demo.joblib)",
        "ml_prediction": ml_priority,
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


def generate_adaptive_plan(
    skill_type: str,
    current_score: float,
    previous_score: float = None,
    grade: str = "4",
    scores_dict: dict = None,
    attempts: int = 1,
    hints_used: int = 0
):
    """
    Generate a 3-stage adaptive adventure roadmap for Grade 3-5 children based on expert rules
    and machine learning predictions from the trained Random Forest model.
    - Stage 1: Easy / Foundational (warm-up at learner's comfortable entry point)
    - Stage 2: Guided Practice (core practice target)
    - Stage 3: Gentle Challenge (stretch goal to stimulate cognitive progression)
    """
    evaluation = evaluate_skill(
        score=current_score,
        previous_score=previous_score,
        skill_type=skill_type,
        scores_dict=scores_dict,
        attempts=attempts,
        hints_used=hints_used
    )
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
            stage1_title = "Stage 1: Letter Quest — Practice 'A' (A–Z Tracing)"
            stage1_diff = "Foundational (Letter Tracing)"
            stage1_desc = "Trace capital and lowercase letters from A to Z along handwriting guide lines with stroke arrows."
            stage1_rules = ["R01", "R04", "R08", "R09", "R21", "R22"]
            stage1_letter = "A"
            stage1_lower = "a"
            stage1_sound = "/æ/ as in Apple & Ant 🍎"
            stage1_hint = "Start from the top dot and trace down straight along the guide lines! ✏️"
        elif band == "medium":
            evaluation["rules_applied"].extend(["R02", "R04", "R08", "R10", "R22"])
            stage1_title = "Stage 1: Letter Quest — Practice 'A' (Stroke Precision)"
            stage1_diff = "Guided Practice (Letter Formation)"
            stage1_desc = "Master the curve radius and straight alignment of letters from A to Z."
            stage1_rules = ["R02", "R04", "R08", "R10", "R22"]
            stage1_letter = "A"
            stage1_lower = "a"
            stage1_sound = "/æ/ as in Apple & Astronaut 🚀"
            stage1_hint = "Trace each stroke carefully along the lines without rushing!"
        else:
            evaluation["rules_applied"].extend(["R03", "R04", "R10", "R16"])
            stage1_title = "Stage 1: Letter Quest — Fast & Fluent Tracing"
            stage1_diff = "Proficient (Stroke Agility)"
            stage1_desc = "Trace clean letterforms with consistent handwriting slant for letters A to Z."
            stage1_rules = ["R03", "R04", "R10", "R16"]
            stage1_letter = "A"
            stage1_lower = "a"
            stage1_sound = "/æ/ as in Adventure & Ace ⭐"
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
                    "word_example": "Apple",
                    "letter_number": 1,
                    "total_letters": 26,
                    "letters_set": [
                        "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
                        "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
                    ],
                    "stroke_steps": [
                        {"step": 1, "instruction": "Left slant stroke from top", "icon": "arrow_downward", "color": "#3b82f6"},
                        {"step": 2, "instruction": "Right slant stroke from top", "icon": "arrow_downward", "color": "#f97316"},
                        {"step": 3, "instruction": "Horizontal bar across midline", "icon": "horizontal_rule", "color": "#eab308"}
                    ],
                    "hint": stage1_hint,
                    "question": f"Letter Quest: Practice tracing uppercase '{stage1_letter}' and lowercase '{stage1_lower}' (Complete all 26 letters A–Z to unlock Stage 2)",
                    "options": ["Trace Letter 'A'", "Listen to Sound /æ/", "Clear & Retry"],
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
    elif selected_skill == "reading":
        # Rule evaluation for Reading (Phonics, Decoding, Expressive Fluency):
        # Score < 45: R01, R07, R08, R09, R21, R22 (Foundational sight words, single phonemes, audio echo)
        # Score 45-74: R02, R07, R08, R10, R22 (Guided blends, two-word phrases, pronunciation cadence)
        # Score >= 75: R03, R07, R10, R16, R25 (Fluent expression, multi-syllable phrases, story sentences)
        if band == "low":
            evaluation["rules_applied"].extend(["R01", "R07", "R08", "R09", "R21", "R22"])
            s1_acts = [
                {"id": 1, "word": "APPLE", "phonics": "/æ-p-əl/", "image": "🍎", "sentence": "A sweet red apple.", "prompt": "Can you say this with me? Apple!", "tip": "Open wide for 'Ah' sound!"},
                {"id": 2, "word": "RIVER", "phonics": "/r-ɪ-v-ər/", "image": "🌊", "sentence": "The river flows gently.", "prompt": "Listen closely: River! Repeat loudly!", "tip": "Roll tongue gently for 'R'!"},
                {"id": 3, "word": "FOREST", "phonics": "/f-ɔːr-ɪ-s-t/", "image": "🌲", "sentence": "Tall green forest trees.", "prompt": "Help the lion cross: Forest!", "tip": "Speak clearly into the mic!"}
            ]
            s2_acts = [
                {"id": 1, "word": "RED APPLE", "phonics": "/rɛd æ-p-əl/", "image": "🍎", "sentence": "A bright red apple on the branch.", "prompt": "Say both words: Red Apple!", "tip": "Keep a small pause between words."},
                {"id": 2, "word": "BLUE RIVER", "phonics": "/bluː r-ɪ-v-ər/", "image": "🌊", "sentence": "Water glitters in the blue river.", "prompt": "Repeat clearly: Blue River!", "tip": "Smooth breath out on 'Blue'."},
                {"id": 3, "word": "LION ROAR", "phonics": "/laɪ-ən rɔːr/", "image": "🦁", "sentence": "The happy lion gave a roar.", "prompt": "One more step across: Lion Roar!", "tip": "Speak strong and proud!"}
            ]
            s3_acts = [
                {"id": 1, "word": "The lion crossed the bridge.", "phonics": "/ðə laɪ-ən krɔst ðə brɪdʒ/", "image": "🌉", "sentence": "Step 1 of the story sentence.", "prompt": "Read the complete story sentence!", "tip": "Read each word smoothly together."},
                {"id": 2, "word": "He found a golden star.", "phonics": "/hi faʊnd ə ɡoʊl-dən stɑːr/", "image": "⭐", "sentence": "Step 2 of the story adventure.", "prompt": "Almost there: Read with expression!", "tip": "Emphasize 'golden star'!"},
                {"id": 3, "word": "All the jungle friends cheered.", "phonics": "/ɔːl ðə dʒʌŋ-ɡəl frɛndz tʃɪərd/", "image": "🎉", "sentence": "Adventure champion achievement!", "prompt": "Finish the quest: Final cheer sentence!", "tip": "Smile while speaking!"}
            ]
        elif band == "medium":
            evaluation["rules_applied"].extend(["R02", "R07", "R08", "R10", "R22"])
            s1_acts = [
                {"id": 1, "word": "BUTTERFLY", "phonics": "/bʌt-ər-flaɪ/", "image": "🦋", "sentence": "A colorful butterfly fluttered by.", "prompt": "Three syllables: But-ter-fly!", "tip": "Tap your finger for each beat!"},
                {"id": 2, "word": "SUNSHINE", "phonics": "/sʌn-ʃaɪn/", "image": "☀️", "sentence": "Warm sunshine through the leaves.", "prompt": "Say it bright: Sun-shine!", "tip": "Clear 'sh' sound in the middle!"},
                {"id": 3, "word": "RAINBOW", "phonics": "/reɪn-boʊ/", "image": "🌈", "sentence": "A rainbow arched over the river.", "prompt": "Cross the bridge with: Rain-bow!", "tip": "Smooth glide between rain and bow!"}
            ]
            s2_acts = [
                {"id": 1, "word": "WOODEN BRIDGE", "phonics": "/wʊd-ən brɪdʒ/", "image": "🪵", "sentence": "Step lightly across the wooden bridge.", "prompt": "Speak clearly: Wooden Bridge!", "tip": "Crisp 'd' in wooden."},
                {"id": 2, "word": "SILVER STREAM", "phonics": "/sɪl-vər striːm/", "image": "💧", "sentence": "Clean water in the silver stream.", "prompt": "Listen and repeat: Silver Stream!", "tip": "Blend 'str' cleanly in stream."},
                {"id": 3, "word": "HAPPY MONKEY", "phonics": "/hæp-i mʌŋ-ki/", "image": "🐵", "sentence": "A happy monkey swung from the vine.", "prompt": "Final bridge step: Happy Monkey!", "tip": "Keep your voice bouncy and lively!"}
            ]
            s3_acts = [
                {"id": 1, "word": "Ruby the deer leaped over the log.", "phonics": "/ruː-bi ðə dɪər liːpt oʊ-vər ðə lɔːɡ/", "image": "🦌", "sentence": "Story flow practice.", "prompt": "Read the story sentence with rhythm!", "tip": "Keep a steady walking rhythm."},
                {"id": 2, "word": "The jungle path was bright and warm.", "phonics": "/ðə dʒʌŋ-ɡəl pæθ wʌz braɪt ænd wɔːrm/", "image": "🌿", "sentence": "Atmospheric reading.", "prompt": "Speak clearly: The jungle path was bright!", "tip": "Pause gently at natural breaks."},
                {"id": 3, "word": "They celebrated with fresh mangoes.", "phonics": "/ðeɪ sɛl-ə-breɪ-tɪd wɪð frɛʃ mæŋ-ɡoʊz/", "image": "🥭", "sentence": "Celebration milestone.", "prompt": "Conquer stage 3: Final sentence!", "tip": "Crisp ending on mangoes!"}
            ]
        else:
            evaluation["rules_applied"].extend(["R03", "R07", "R10", "R16", "R25"])
            s1_acts = [
                {"id": 1, "word": "EXTRAORDINARY", "phonics": "/ɪk-strɔːr-dən-ɛr-i/", "image": "✨", "sentence": "An extraordinary journey through Sri Lanka.", "prompt": "Master this big word: Ex-traor-di-na-ry!", "tip": "Pace each syllable without rushing."},
                {"id": 2, "word": "COURAGEOUS", "phonics": "/kə-reɪ-dʒəs/", "image": "🦁", "sentence": "The courageous lion stepped forward.", "prompt": "Say it with boldness: Cou-ra-geous!", "tip": "Strong middle 'ray' stress."},
                {"id": 3, "word": "SPLENDID", "phonics": "/splɛn-dɪd/", "image": "🌟", "sentence": "A splendid view from the top of Sigiriya.", "prompt": "Cross the bridge: Splen-did!", "tip": "Crisp blend on 'spl'!"}
            ]
            s2_acts = [
                {"id": 1, "word": "ANCIENT FORTRESS", "phonics": "/eɪn-ʃənt fɔːr-trɪs/", "image": "🏰", "sentence": "They explored the ancient fortress.", "prompt": "Read phrase: Ancient Fortress!", "tip": "Soft 'sh' in ancient."},
                {"id": 2, "word": "MISTY MOUNTAINS", "phonics": "/mɪs-ti maʊn-tənz/", "image": "⛰️", "sentence": "Clouds drift across the misty mountains.", "prompt": "Repeat: Misty Mountains!", "tip": "Gentle breath on misty."},
                {"id": 3, "word": "GOLDEN HORIZON", "phonics": "/ɡoʊl-dən hə-raɪ-zən/", "image": "🌅", "sentence": "Sunset lit the golden horizon.", "prompt": "Reach the goal: Golden Horizon!", "tip": "Rise and fall naturally in pitch."}
            ]
            s3_acts = [
                {"id": 1, "word": "The travelers marveled at the whispering waterfalls.", "phonics": "/ðə træv-əl-ərz mɑːr-vəld æt ðə wɪs-pər-ɪŋ wɔː-tər-fɔːlz/", "image": "🌊", "sentence": "Poetic reading mastery.", "prompt": "Read with expressive cadence and depth!", "tip": "Paint the picture with your voice."},
                {"id": 2, "word": "Every step brought a discovery more wonderful than the last.", "phonics": "/ɛv-ri stɛp brɔːt ə dɪ-skʌv-ər-i mɔːr wʌn-dər-fəl ðæn ðə læst/", "image": "🧭", "sentence": "Story climax reading.", "prompt": "Read with confidence and dramatic flair!", "tip": "Keep your breathing calm and steady."},
                {"id": 3, "word": "United by adventure, they stood proud as literacy champions.", "phonics": "/juː-naɪ-tɪd baɪ æd-vɛn-tʃər ðeɪ stʊd praʊd æz lɪt-ər-ə-si tʃæm-pi-ənz/", "image": "🏆", "sentence": "Trophy mastery passage.", "prompt": "Deliver the champion grand finale!", "tip": "Finish strong and proud!"}
            ]

        stages = [
            {
                "stage_number": 1,
                "title": f"Stage 1: Speak & Repeat — {s1_acts[0]['word']} Safari",
                "difficulty": "Easy (Phonics & Sight Words)",
                "description": "Listen to the guide and repeat each word into the microphone to help the lion cross the bridge.",
                "rules": ["R01", "R07", "R08", "R09", "R22"],
                "xp_reward": 50,
                "stars": 3,
                "locked": False,
                "status": "Ready",
                "task_data": {
                    "type": "reading_speak_repeat",
                    "target_skill": "reading",
                    "band": band,
                    "activities": s1_acts,
                    "total_activities": len(s1_acts),
                    "pro_tip": "Speak loudly and clearly into the microphone. Don't rush!",
                    "bridge_goal": "Help the lion cross the bridge!",
                    "question": f"Speak & Repeat Challenge: Say '{s1_acts[0]['word']}' to move the lion forward!",
                    "options": [s1_acts[0]["word"], s1_acts[1]["word"], s1_acts[2]["word"]],
                    "correct_index": 0,
                    "hint": "Listen carefully to the sound, then tap the mic and speak!"
                }
            },
            {
                "stage_number": 2,
                "title": f"Stage 2: Speak & Repeat — Word Blends & Pairs",
                "difficulty": "Moderate (Guided Phonics Pairs)",
                "description": "Combine words into natural Sri Lankan jungle phrases with correct tempo and stress.",
                "rules": ["R02", "R07", "R08", "R10", "R22"],
                "xp_reward": 75,
                "stars": 3,
                "locked": True,
                "status": "Locked",
                "task_data": {
                    "type": "reading_speak_repeat",
                    "target_skill": "reading",
                    "band": band,
                    "activities": s2_acts,
                    "total_activities": len(s2_acts),
                    "pro_tip": "Leave a tiny breath between words so each word is clear and bright!",
                    "bridge_goal": "Help the mascot cross the rushing river bridge!",
                    "question": f"Speak & Repeat Challenge: Say '{s2_acts[0]['word']}' clearly!",
                    "options": [s2_acts[0]["word"], s2_acts[1]["word"], s2_acts[2]["word"]],
                    "correct_index": 0,
                    "hint": "Listen to how the guide blends the words, then repeat!"
                }
            },
            {
                "stage_number": 3,
                "title": "Stage 3: Speak & Repeat — Story Sentence Mastery",
                "difficulty": "Challenge (Full Story Sentences)",
                "description": "Read complete story sentences with expressive cadence, natural pauses, and confidence.",
                "rules": ["R03", "R07", "R10", "R16", "R25"],
                "xp_reward": 100,
                "stars": 3,
                "locked": True,
                "status": "Locked",
                "task_data": {
                    "type": "reading_speak_repeat",
                    "target_skill": "reading",
                    "band": band,
                    "activities": s3_acts,
                    "total_activities": len(s3_acts),
                    "pro_tip": "Read with feeling! Imagine you are telling this adventure to your friends!",
                    "bridge_goal": "Guide the adventure team across the final champion bridge to the golden trophy!",
                    "question": f"Speak & Repeat Challenge: Read the full story sentence aloud!",
                    "options": [s3_acts[0]["word"], s3_acts[1]["word"], s3_acts[2]["word"]],
                    "correct_index": 0,
                    "hint": "Read smoothly from left to right like a true story champion!"
                }
            }
        ]
    elif selected_skill == "listening":
        # ── LISTENING COMPREHENSION ADAPTIVE BRANCH ─────────────────────────
        # Evaluates auditory processing, focus & comprehension (R02, R06, R18, R22)
        evaluation["rules_applied"] = list(set(evaluation["rules_applied"] + ["R02", "R06", "R18", "R22"]))

        if band == "low":
            # Foundational: Simple sentences, familiar characters, explicit clues
            s1_scene = {
                "scene_title": "Tommy the Little Rabbit",
                "character": "🐰 Tommy the Little Rabbit",
                "image": "🐰🥕🌸",
                "hero_image": "https://lh3.googleusercontent.com/aida-public/AB6AXuCJbFzZmwGiE99Z2ai-PtBQ3egMU9hVLkkthqYpM369usNTXaIZ6cacXON1QZTYUMucYhfiF8nCAOVbia4duIUAyWzbxgyNr3Yn5opgURbnbHy8auyBIzEQNL5Yfd8Le2hfxz0-38uNv9v01bHfalcKA9kHrKz6ZM9-5XKGS3kgv1-P77TCVgEa9AQm9IrLjvl8rXm0r0wmGWYPzN7vkWMXaNSRnKTSboedNwxyqoZjcczsOBc06ikitg",
                "story_text": "Tommy is a little rabbit. He lives near a green forest. Tommy loves to eat carrots.",
                "highlight_word": "carrots",
                "audio_text": "Tommy is a little rabbit. He lives near a green forest. Tommy loves to eat carrots.",
                "sentence": "Tommy is a little rabbit. He lives near a green forest. Tommy loves to eat carrots.",
                "picture_options": [
                    {
                        "label": "Carrot",
                        "emoji": "🥕",
                        "img": "https://lh3.googleusercontent.com/aida-public/AB6AXuBqJFohEZjKyDCC0CR17xgQPNSk5XlbvtKszrDcvxc1mCbec0FP0UEylnIkhfwLQr7aZTELrqJ9Vr5-A9vP7xPfxUciUwzh1JEQwFKNzIQ8e0U3X75lhn2BJCvWpUkRWgwFltXVTC4yr2aV8-ZmaNiZ4Ip7O_fniqC0IS3wtmRgSMji7dT_-x1m2Meq0WU1aVqCjT5bAFxp2U1TJgj1_KdRufMYT8NJuM7-Xom7mUrwP0EvH8LPr8qLDg"
                    },
                    {
                        "label": "Apple",
                        "emoji": "🍎",
                        "img": "https://lh3.googleusercontent.com/aida-public/AB6AXuBqJFohEZjKyDCC0CR17xgQPNSk5XlbvtKszrDcvxc1mCbec0FP0UEylnIkhfwLQr7aZTELrqJ9Vr5-A9vP7xPfxUciUwzh1JEQwFKNzIQ8e0U3X75lhn2BJCvWpUkRWgwFltXVTC4yr2aV8-ZmaNiZ4Ip7O_fniqC0IS3wtmRgSMji7dT_-x1m2Meq0WU1aVqCjT5bAFxp2U1TJgj1_KdRufMYT8NJuM7-Xom7mUrwP0EvH8LPr8qLDg"
                    },
                    {
                        "label": "Pizza",
                        "emoji": "🍕",
                        "img": "https://lh3.googleusercontent.com/aida-public/AB6AXuBqJFohEZjKyDCC0CR17xgQPNSk5XlbvtKszrDcvxc1mCbec0FP0UEylnIkhfwLQr7aZTELrqJ9Vr5-A9vP7xPfxUciUwzh1JEQwFKNzIQ8e0U3X75lhn2BJCvWpUkRWgwFltXVTC4yr2aV8-ZmaNiZ4Ip7O_fniqC0IS3wtmRgSMji7dT_-x1m2Meq0WU1aVqCjT5bAFxp2U1TJgj1_KdRufMYT8NJuM7-Xom7mUrwP0EvH8LPr8qLDg"
                    }
                ],
                "blank_sentence": {
                    "prefix": "Tommy is a little",
                    "suffix": ".",
                    "correct": "Rabbit",
                    "options": ["Rabbit", "Bear"]
                },
                "sequence_steps": [
                    {"step": 1, "label": "Forest Path", "emoji": "🌲", "img": "https://lh3.googleusercontent.com/aida-public/AB6AXuC6W0jz8BJDT9nK-pjnmrSAcxpnTFGdViDv-7xQrI58YESwPvLFif8dAgIpi54R-RZeejvWonVk1YwHDqXsGV7QLfKwUZzxw6uR65x9SApheLxluaQ6KLKH-LNJ8JIkOsjyKhzrnE9SUslL7eI_HxEFwzk9vRpuhCLMdk1m2LVjij3Rjxr8ZS6ohIPlv72d4G642dBsNdJ0nWblO1IdYb6Wu9PwO8b4SZ40wLeTk6qOReh82O0xHlfwUw"},
                    {"step": 2, "label": "Tommy Hopping", "emoji": "🐰"},
                    {"step": 3, "label": "Eating Carrots", "emoji": "🥕"}
                ],
                "questions": [
                    {
                        "id": 1,
                        "question": "What does Tommy like?",
                        "options": ["Carrot", "Apple", "Pizza"],
                        "correct_index": 0,
                        "hint": "Listen carefully to what Tommy loves to eat!"
                    },
                    {
                        "id": 2,
                        "question": "Fill in the missing word: Tommy is a little...",
                        "options": ["Rabbit", "Bear"],
                        "correct_index": 0,
                        "hint": "Tommy is a friendly hopping animal with long ears!"
                    }
                ]
            }
            s2_scene = {
                "scene_title": "The Silver Fish in the Clear River",
                "image": "🐟🌊🌿",
                "audio_text": "Three silver fish are swimming happily in the cool, clear river water.",
                "sentence": "Three silver fish swim in the cool, clear river.",
                "questions": [
                    {
                        "id": 1,
                        "question": "How many fish are swimming in the river?",
                        "options": ["Three fish", "One fish", "Ten fish"],
                        "correct_index": 0,
                        "hint": "Count the number mentioned right at the start!"
                    },
                    {
                        "id": 2,
                        "question": "How does the river water feel?",
                        "options": ["Cool and clear", "Hot and muddy", "Dark and stormy"],
                        "correct_index": 0,
                        "hint": "It feels refreshing on a sunny day!"
                    }
                ]
            }
            s3_scene = {
                "scene_title": "Yellow Birds at Sunrise",
                "image": "🌄🦜🌸",
                "audio_text": "Early in the morning, bright yellow birds sing joyful songs from flowering branches.",
                "sentence": "Yellow birds sing joyful songs from flowering branches.",
                "questions": [
                    {
                        "id": 1,
                        "question": "When do the bright yellow birds sing?",
                        "options": ["Early in the morning", "At midnight", "During dinner time"],
                        "correct_index": 0,
                        "hint": "Think about when the sun first rises!"
                    },
                    {
                        "id": 2,
                        "question": "What color are the singing birds?",
                        "options": ["Bright yellow", "Deep purple", "Pitch black"],
                        "correct_index": 0,
                        "hint": "They look like bright little drops of sunshine!"
                    }
                ]
            }
        elif band == "medium":
            # Guided: Multi-clause sentences, contextual cues, descriptive adjectives
            s1_scene = {
                "scene_title": "Monkeys by the Roaring Waterfall",
                "image": "🏞️🐒💧",
                "audio_text": "A family of playful monkeys swings across the vine bridges right beside the roaring white waterfall.",
                "sentence": "Playful monkeys swing across vines beside the roaring waterfall.",
                "questions": [
                    {
                        "id": 1,
                        "question": "What sound does the waterfall make?",
                        "options": ["Roaring and loud", "Silent and still", "Beeping like a horn"],
                        "correct_index": 0,
                        "hint": "Listen to the word describing the rushing water!"
                    },
                    {
                        "id": 2,
                        "question": "How do the monkeys travel near the waterfall?",
                        "options": ["Swinging on vine bridges", "Riding in wooden boats", "Walking along a sidewalk"],
                        "correct_index": 0,
                        "hint": "They use jungle vines to cross!"
                    }
                ]
            }
            s2_scene = {
                "scene_title": "Golden Harvest in the Village",
                "image": "🌾🥁☀️",
                "audio_text": "Farmers in straw hats gather bundles of golden rice under warm sunshine while festival drums echo across the valley.",
                "sentence": "Farmers gather golden rice under sunshine while drums echo.",
                "questions": [
                    {
                        "id": 1,
                        "question": "What instruments echo across the valley?",
                        "options": ["Festival drums", "Electric guitars", "Train whistles"],
                        "correct_index": 0,
                        "hint": "Traditional instruments played during harvests!"
                    },
                    {
                        "id": 2,
                        "question": "What are the farmers wearing on their heads?",
                        "options": ["Straw hats", "Heavy iron helmets", "Woolen winter beanies"],
                        "correct_index": 0,
                        "hint": "Hats made from dried straw to block the sun!"
                    }
                ]
            }
            s3_scene = {
                "scene_title": "Island Lighthouse Beacon",
                "image": "🏮⛵🌊",
                "audio_text": "The tall red lighthouse flashes its bright beam three times every minute to guide small fishing boats safely to the harbor.",
                "sentence": "The red lighthouse flashes its beam to guide boats to the harbor.",
                "questions": [
                    {
                        "id": 1,
                        "question": "How many times does the lighthouse beam flash each minute?",
                        "options": ["Three times", "Once an hour", "Ten times per second"],
                        "correct_index": 0,
                        "hint": "Count the flashes mentioned in the audio!"
                    },
                    {
                        "id": 2,
                        "question": "Why does the lighthouse flash its bright beam?",
                        "options": ["To guide boats safely to the harbor", "To attract wild seagulls", "To wake up the villagers"],
                        "correct_index": 0,
                        "hint": "It keeps fishermen safe in the dark waters!"
                    }
                ]
            }
        else:
            # High: Complex descriptive passages, inferential questions, rich Sri Lankan scenery
            s1_scene = {
                "scene_title": "The Lion Rock Citadel",
                "image": "🦁🏰🌤️",
                "audio_text": "Perched atop the ancient granite fortress, monumental stone lion paws stand as timeless sentinels watching over emerald valleys.",
                "sentence": "Monumental stone lion paws stand as sentinels watching over emerald valleys.",
                "questions": [
                    {
                        "id": 1,
                        "question": "What do the monumental stone lion paws act as?",
                        "options": ["Timeless sentinels watching over the valley", "Simple decorative pet carvings", "Temporary modern pillars"],
                        "correct_index": 0,
                        "hint": "A sentinel is a noble guardian!"
                    },
                    {
                        "id": 2,
                        "question": "What natural landscape surrounds the ancient fortress?",
                        "options": ["Emerald misty valleys", "Dry endless desert dunes", "Frozen ice plains"],
                        "correct_index": 0,
                        "hint": "Think of lush green forests!"
                    }
                ]
            }
            s2_scene = {
                "scene_title": "Nocturnal Rain Forest Melody",
                "image": "⛈️🍃🦉",
                "audio_text": "As distant thunder rolls across the mountain ridge, nocturnal owls exchange resonant calls amidst the rhythmic patter of monsoon rain.",
                "sentence": "Nocturnal owls exchange resonant calls amidst the rhythmic patter of monsoon rain.",
                "questions": [
                    {
                        "id": 1,
                        "question": "Which natural sound accompanies the owls' nocturnal calls?",
                        "options": ["Rhythmic patter of monsoon rain", "Screeching city traffic", "Hum of factory machinery"],
                        "correct_index": 0,
                        "hint": "Listen for the sound falling from the stormy sky!"
                    },
                    {
                        "id": 2,
                        "question": "What atmospheric event rolls across the mountain ridge?",
                        "options": ["Distant thunder", "A blazing fireworks show", "A speeding railway train"],
                        "correct_index": 0,
                        "hint": "A deep rumbling sound during a storm!"
                    }
                ]
            }
            s3_scene = {
                "scene_title": "Subterranean Cavern Acoustics",
                "image": "💎🦇💧",
                "audio_text": "Inside the sacred limestone cavern, crystal water droplets resonate in pure acoustic harmony, echoing through ancient winding passages.",
                "sentence": "Crystal water droplets resonate in pure acoustic harmony inside the limestone cavern.",
                "questions": [
                    {
                        "id": 1,
                        "question": "What creates the pure acoustic harmony inside the cavern?",
                        "options": ["Crystal water droplets resonating", "A mechanical chime clock", "Loud speakers playing music"],
                        "correct_index": 0,
                        "hint": "Natural drops of water hitting the cave floor!"
                    },
                    {
                        "id": 2,
                        "question": "What material forms the winding passages of the cavern?",
                        "options": ["Sacred limestone rock", "Black volcanic glass", "Soft synthetic plastic"],
                        "correct_index": 0,
                        "hint": "The natural stone forming the ancient caves!"
                    }
                ]
            }

        stages = [
            {
                "stage_number": 1,
                "title": f"Stage 1: {s1_scene['scene_title']}",
                "difficulty": "Easy (Foundational)" if band == "low" else "Warm-up" if band == "medium" else "Advanced Ear",
                "description": f"Listen to the scene description and answer 2 comprehension questions.",
                "rules": ["R01", "R06", "R18", "R22"],
                "xp_reward": 50,
                "stars": 3,
                "locked": False,
                "status": "Ready",
                "task_data": {
                    "type": "listening_comprehension",
                    "target_skill": "listening",
                    "band": band,
                    "scene_title": s1_scene["scene_title"],
                    "character": s1_scene.get("character", s1_scene["scene_title"]),
                    "hero_image": s1_scene.get("hero_image"),
                    "story_text": s1_scene.get("story_text", s1_scene["sentence"]),
                    "highlight_word": s1_scene.get("highlight_word", "carrots"),
                    "picture_options": s1_scene.get("picture_options", []),
                    "blank_sentence": s1_scene.get("blank_sentence"),
                    "sequence_steps": s1_scene.get("sequence_steps", []),
                    "image": s1_scene["image"],
                    "audio_text": s1_scene["audio_text"],
                    "sentence": s1_scene["sentence"],
                    "questions": s1_scene["questions"],
                    "pro_tip": "Close your eyes while listening to visualize the scene in your mind!",
                    "bridge_goal": "Listen to the scene and solve the activities to build the first bridge!",
                    "question": s1_scene["questions"][0]["question"],
                    "options": s1_scene["questions"][0]["options"],
                    "correct_index": s1_scene["questions"][0]["correct_index"],
                    "hint": s1_scene["questions"][0]["hint"],
                }
            },
            {
                "stage_number": 2,
                "title": f"Stage 2: {s2_scene['scene_title']}",
                "difficulty": "Moderate (Guided Practice)",
                "description": f"Focus on auditory details and keywords to answer both questions correctly.",
                "rules": ["R02", "R06", "R18", "R23"],
                "xp_reward": 75,
                "stars": 3,
                "locked": True,
                "status": "Locked",
                "task_data": {
                    "type": "listening_comprehension",
                    "target_skill": "listening",
                    "band": band,
                    "scene_title": s2_scene["scene_title"],
                    "image": s2_scene["image"],
                    "audio_text": s2_scene["audio_text"],
                    "sentence": s2_scene["sentence"],
                    "questions": s2_scene["questions"],
                    "pro_tip": "Replay the audio if you need to catch details like numbers or colors!",
                    "bridge_goal": "Cross the river of sound by unlocking both clue answers!",
                    "question": s2_scene["questions"][0]["question"],
                    "options": s2_scene["questions"][0]["options"],
                    "correct_index": s2_scene["questions"][0]["correct_index"],
                    "hint": s2_scene["questions"][0]["hint"],
                }
            },
            {
                "stage_number": 3,
                "title": f"Stage 3: {s3_scene['scene_title']}",
                "difficulty": "Challenge (Mastery Stretch)",
                "description": f"Ultimate listening test! Comprehend full descriptive sentences to win the golden trophy.",
                "rules": ["R03", "R06", "R16", "R25"],
                "xp_reward": 100,
                "stars": 3,
                "locked": True,
                "status": "Locked",
                "task_data": {
                    "type": "listening_comprehension",
                    "target_skill": "listening",
                    "band": band,
                    "scene_title": s3_scene["scene_title"],
                    "image": s3_scene["image"],
                    "audio_text": s3_scene["audio_text"],
                    "sentence": s3_scene["sentence"],
                    "questions": s3_scene["questions"],
                    "pro_tip": "You are a master listener! Notice subtle adjectives and actions in the story!",
                    "bridge_goal": "Reach the golden audio trophy at the end of the quest!",
                    "question": s3_scene["questions"][0]["question"],
                    "options": s3_scene["questions"][0]["options"],
                    "correct_index": s3_scene["questions"][0]["correct_index"],
                    "hint": s3_scene["questions"][0]["hint"],
                }
            }
        ]
    else:
        # Fallback 3-Stage Plan
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
