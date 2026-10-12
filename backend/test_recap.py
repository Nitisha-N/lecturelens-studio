import unittest
from extractor import SlideDeckExtractor
from recap_engine import CourseRecapEngine

class TestCourseRecapGenerator(unittest.TestCase):

    def setUp(self):
        self.mock_slides = [
            {
                "slide_number": 1,
                "title": "Introduction to Neural Networks",
                "body": "Deep Learning: A subfield of machine learning.\nArtificial Neural Networks (ANN): Computational models inspired by human brain.",
                "bullets": ["• Deep Learning intro", "• Neural network structure"],
                "code_snippets": ["import torch", "model = torch.nn.Sequential()"],
                "tables": [],
                "raw_text": "Introduction to Neural Networks\nDeep Learning: A subfield of machine learning.\nArtificial Neural Networks (ANN): Computational models inspired by human brain."
            },
            {
                "slide_number": 2,
                "title": "Activation Functions",
                "body": "ReLU: Rectified Linear Unit, f(x) = max(0, x).\nSigmoid: S-shaped curve scaling outputs between 0 and 1.",
                "bullets": ["• ReLU activation", "• Sigmoid activation"],
                "code_snippets": ["def relu(x): return max(0, x)"],
                "tables": [],
                "raw_text": "Activation Functions\nReLU: Rectified Linear Unit, f(x) = max(0, x).\nSigmoid: S-shaped curve scaling outputs between 0 and 1."
            }
        ]

    def test_recap_engine_heuristic(self):
        engine = CourseRecapEngine()
        recap = engine.generate_recap(self.mock_slides)

        self.assertIn("course_title", recap)
        self.assertEqual(recap["total_slides"], 2)
        self.assertGreaterEqual(len(recap["modules"]), 1)
        self.assertGreaterEqual(len(recap["mermaid_diagrams"]), 1)

        # Verify Mermaid diagram structure
        mindmap = recap["mermaid_diagrams"][0]
        self.assertIn("code", mindmap)
        self.assertTrue(mindmap["code"].startswith("mindmap"))

        # Verify Review Questions
        self.assertGreaterEqual(len(recap["review_questions"]), 1)

    def test_mermaid_validation(self):
        engine = CourseRecapEngine()
        raw_diagrams = [
            {"title": "Test Flow", "type": "flowchart", "code": "```mermaid\ngraph TD\n A-->B\n```"}
        ]
        cleaned = engine._clean_and_validate_mermaid(raw_diagrams)
        self.assertEqual(cleaned[0]["code"], "graph TD\n A-->B")

if __name__ == "__main__":
    unittest.main()
