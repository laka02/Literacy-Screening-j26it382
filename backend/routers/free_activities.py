"""
CAIRE — Free Activities Router
Returns 3 default free/trial activities (Writing, Reading, Listening)
for users who click "Try Learning Free" on the Home page.
No authentication required.
"""
from fastapi import APIRouter

router = APIRouter()


FREE_ACTIVITIES = [
    {
        "id": "free-writing-1",
        "skill": "writing",
        "title": "Trace the Letter A",
        "subtitle": "Leo the Lion's Writing Adventure",
        "emoji": "🦁",
        "color_from": "#fff7ed",
        "color_to": "#fef3c7",
        "border_color": "#fcd34d",
        "accent": "#d97706",
        "description": (
            "Help Leo trace the letter 'A'! Follow the dotted path "
            "with your finger or mouse to write a perfect letter."
        ),
        "instructions": [
            "Follow the dotted arrow trail",
            "Start at the top and go down-left",
            "Lift and make the crossbar",
            "Great job — you wrote 'A'!",
        ],
        "letter": "A",
        "guide_text": (
            "A is for Apple, A is for Ant! "
            "Leo loves learning the letter A. Can you trace it too?"
        ),
    },
    {
        "id": "free-reading-1",
        "skill": "reading",
        "title": "Say the Sunshine Word",
        "subtitle": "Ruby the Deer's Reading Game",
        "emoji": "🦌",
        "color_from": "#f0fdf4",
        "color_to": "#dcfce7",
        "border_color": "#86efac",
        "accent": "#16a34a",
        "description": (
            "Ruby needs your help! Say each word shown on the card out loud. "
            "Press the microphone button and read the glowing word clearly."
        ),
        "instructions": [
            "Look at the word on the card",
            "Press the mic button",
            "Say the word out loud clearly",
            "Earn a gold star for each word!",
        ],
        "words": ["SUN", "CAT", "DOG", "HAT", "BIG"],
        "guide_text": (
            "Reading is magic! Every word you say makes Ruby dance with joy. "
            "Tap the mic and say the word loud and proud!"
        ),
    },
    {
        "id": "free-listening-1",
        "skill": "listening",
        "title": "Tommy's Little Story",
        "subtitle": "Barnaby the Bear's Listening Quest",
        "emoji": "🐻",
        "color_from": "#eff6ff",
        "color_to": "#dbeafe",
        "border_color": "#93c5fd",
        "accent": "#2563eb",
        "description": (
            "Listen to Barnaby tell Tommy's story! Press the play button, "
            "hear the story carefully, then answer a quick question."
        ),
        "instructions": [
            "Press the big play button",
            "Listen to the whole story",
            "Answer the question below",
            "Barnaby gives you a star!",
        ],
        "story_text": (
            "Tommy is a little rabbit. He lives near a green forest. "
            "Tommy loves to eat carrots."
        ),
        "question": "What does Tommy love to eat?",
        "options": ["Carrots", "Pizza", "Cake"],
        "correct_answer": "Carrots",
        "guide_text": (
            "Great listeners are great learners! Press play and hear "
            "Barnaby read Tommy's story. Then answer the question!"
        ),
    },
]


@router.get("/")
async def get_free_activities():
    """Return 3 default free activities — one per skill."""
    return {
        "status": "ok",
        "activities": FREE_ACTIVITIES,
        "total": len(FREE_ACTIVITIES),
    }


@router.get("/{activity_id}")
async def get_free_activity(activity_id: str):
    """Return a single free activity by its ID."""
    for act in FREE_ACTIVITIES:
        if act["id"] == activity_id:
            return {"status": "ok", "activity": act}
    return {"status": "not_found", "activity": None}
