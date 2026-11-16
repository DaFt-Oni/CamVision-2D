import unittest
from pathlib import Path
from prepare_video import timing_plan


class Timings(unittest.TestCase):
    def test_audio_drives_each_section(self):
        sections = [{"id": "01", "audio": "uno.mp3", "visuals": ["uno.png"]}, {"id": "02", "audio": "dos.mp3", "visuals": ["dos.mp4"]}]
        plan = timing_plan(Path("proyecto.json"), {"sections": sections, "max_seconds": 600}, lambda path: 30 if path.name == "uno.mp3" else 45)
        self.assertEqual(plan["total_seconds"], 75)
        self.assertEqual(plan["sections"][1]["start_seconds"], 30)
        self.assertTrue(plan["within_limit"])

    def test_limit_is_reported_without_shortening_audio(self):
        plan = timing_plan(Path("proyecto.json"), {"sections": [{"audio": "uno.mp3", "visuals": ["uno.png"]}], "max_seconds": 600}, lambda _: 601)
        self.assertFalse(plan["within_limit"])
        self.assertEqual(plan["total_seconds"], 601)

    def test_invalid_duration_is_rejected(self):
        for duration in [0, -1, float("nan"), float("inf")]:
            with self.assertRaises(ValueError):
                timing_plan(Path("proyecto.json"), {"sections": [{"audio": "uno.mp3"}]}, lambda _: duration)


if __name__ == "__main__":
    unittest.main()
