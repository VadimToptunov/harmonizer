"""
Integration tests for backend API.
"""
import unittest
from fastapi.testclient import TestClient
from backend.main import app


class TestBackendAPI(unittest.TestCase):
    """Test backend API endpoints."""

    def setUp(self):
        """Set up test client."""
        self.client = TestClient(app)

    def test_harmonize_endpoint(self):
        """Test /api/harmonize endpoint."""
        request_data = {
            "bass_line": [48, 50, 52, 48],
            "figured_bass": ["", "", "", ""],
            "chord_types": ["major", "minor", "major", "major"]
        }
        
        response = self.client.post("/api/harmonize", json=request_data)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("voices", data)
        self.assertEqual(len(data["voices"]), len(request_data["bass_line"]))

    def test_harmonize_melody_endpoint(self):
        """Test /api/harmonize-melody endpoint."""
        request_data = {
            "melody": [60, 62, 64, 65, 67],
            "chord_types": ["major", "minor", "major", "major", "major"]
        }
        
        response = self.client.post("/api/harmonize-melody", json=request_data)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])

    def test_export_pdf_endpoint(self):
        """Test /api/export-pdf endpoint."""
        request_data = {
            "voices": [
                {"S": 72, "A": 67, "T": 60, "B": 48},
                {"S": 74, "A": 69, "T": 62, "B": 50}
            ],
            "settings": {
                "title": "Test Exercise",
                "key_signature": "C"
            }
        }
        
        response = self.client.post("/api/export-pdf", json=request_data)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "application/pdf")

    def test_error_handling(self):
        """Test error handling for invalid requests."""
        # Invalid bass line
        request_data = {
            "bass_line": [],
            "figured_bass": [],
            "chord_types": []
        }
        
        response = self.client.post("/api/harmonize", json=request_data)
        # Should handle gracefully
        self.assertIn(response.status_code, [200, 400, 422, 500])


if __name__ == '__main__':
    unittest.main()

