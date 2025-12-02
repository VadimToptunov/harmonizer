"""
E2E tests for UI using Selenium/Playwright

Note: Install dependencies with: pip install -r tests/requirements.txt
"""
import unittest

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.common.action_chains import ActionChains
    from selenium.webdriver.common.keys import Keys
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False
    # Create dummy classes to prevent import errors
    class Dummy:
        pass
    webdriver = Dummy()
    By = Dummy()
    WebDriverWait = Dummy()
    EC = Dummy()
    ActionChains = Dummy()
    Keys = Dummy()

import time


class TestUI(unittest.TestCase):
    """E2E tests for the web UI."""

    @classmethod
    def setUpClass(cls):
        """Set up browser driver."""
        if not SELENIUM_AVAILABLE:
            raise unittest.SkipTest("Selenium is not installed. Install with: pip install selenium")
        
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        cls.driver = webdriver.Chrome(options=options)
        cls.base_url = "http://localhost:3000"

    @classmethod
    def tearDownClass(cls):
        """Close browser."""
        cls.driver.quit()

    def setUp(self):
        """Navigate to app."""
        self.driver.get(self.base_url)
        time.sleep(2)  # Wait for React to load

    def test_page_loads(self):
        """Test that the page loads successfully."""
        self.assertIn("harmony", self.driver.title.lower())

    def test_staff_renders(self):
        """Test that musical staff renders."""
        # Look for staff container
        staff = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='staff-container']"))
        )
        self.assertIsNotNone(staff)

    def test_add_note(self):
        """Test adding a note by clicking on staff."""
        # Click on staff to add note
        staff = self.driver.find_element(By.CSS_SELECTOR, "[data-testid='staff-container']")
        staff.click()
        
        # Verify note was added (check for note count or visual indicator)
        time.sleep(1)
        # Add assertions here

    def test_undo_redo(self):
        """Test undo/redo functionality."""
        undo_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "[aria-label*='Undo']"))
        )
        undo_button.click()
        
        redo_button = self.driver.find_element(By.CSS_SELECTOR, "[aria-label*='Redo']")
        redo_button.click()

    def test_copy_paste(self):
        """Test copy/paste functionality."""
        # Select a note first
        # Then copy
        copy_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "[aria-label*='Copy']"))
        )
        copy_button.click()
        
        # Paste
        paste_button = self.driver.find_element(By.CSS_SELECTOR, "[aria-label*='Paste']")
        paste_button.click()

    def test_keyboard_shortcuts(self):
        """Test keyboard shortcuts."""
        if not SELENIUM_AVAILABLE:
            self.skipTest("Selenium not installed")
        
        # Test Ctrl+Z (undo)
        body = self.driver.find_element(By.TAG_NAME, "body")
        actions = ActionChains(self.driver)
        actions.key_down(Keys.CONTROL).send_keys("z").key_up(Keys.CONTROL).perform()
        time.sleep(0.5)
        
        # Test Ctrl+C (copy)
        actions.key_down(Keys.CONTROL).send_keys("c").key_up(Keys.CONTROL).perform()
        time.sleep(0.5)
        
        # Test Ctrl+V (paste)
        actions.key_down(Keys.CONTROL).send_keys("v").key_up(Keys.CONTROL).perform()
        time.sleep(0.5)

    def test_settings_dialog(self):
        """Test settings dialog."""
        settings_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "[aria-label*='Settings']"))
        )
        settings_button.click()
        
        # Verify dialog opens
        dialog = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[role='dialog']"))
        )
        self.assertIsNotNone(dialog)
        
        # Close dialog
        close_button = self.driver.find_element(By.CSS_SELECTOR, "[aria-label*='Close']")
        close_button.click()

    def test_export_pdf(self):
        """Test PDF export functionality."""
        export_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "[aria-label*='Export']"))
        )
        export_button.click()
        
        # Wait for download or verify API call
        time.sleep(2)


if __name__ == '__main__':
    unittest.main()

