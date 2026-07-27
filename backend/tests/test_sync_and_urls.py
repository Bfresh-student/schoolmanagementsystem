import importlib
from django.test import SimpleTestCase

from apps.sync.registry import registry

class URLPatternTests(SimpleTestCase):
    """Verify that all expected API URL prefixes are present in the project URL configuration."""

    def setUp(self):
        self.urls_module = importlib.import_module('config.urls')
        self.patterns = [p.pattern._route for p in self.urls_module.urlpatterns]

    def assertPatternExists(self, prefix):
        matches = [p for p in self.patterns if p.startswith(prefix)]
        self.assertTrue(matches, f"URL prefix '{prefix}' not found in urlpatterns.")

    def test_admin_pattern(self):
        self.assertPatternExists('admin/')

    def test_students_pattern(self):
        self.assertPatternExists('api/v1/students/')

    def test_teachers_pattern(self):
        self.assertPatternExists('api/v1/teachers/')

    def test_courses_pattern(self):
        self.assertPatternExists('api/v1/courses/')

    def test_grades_pattern(self):
        self.assertPatternExists('api/v1/grades/')

    def test_attendances_pattern(self):
        self.assertPatternExists('api/v1/attendances/')

    def test_enrollments_pattern(self):
        self.assertPatternExists('api/v1/enrollments/')

    def test_notifications_pattern(self):
        self.assertPatternExists('api/v1/notifications/')

    def test_projects_pattern(self):
        self.assertPatternExists('api/v1/projects/')

    def test_events_pattern(self):
        self.assertPatternExists('api/v1/events/')

    def test_finance_pattern(self):
        self.assertPatternExists('api/v1/finance/')

    def test_hr_pattern(self):
        self.assertPatternExists('api/v1/hr/')

    def test_payments_pattern(self):
        self.assertPatternExists('api/v1/payments/')

    def test_media_center_pattern(self):
        self.assertPatternExists('api/v1/media-center/')

    def test_ai_insights_pattern(self):
        self.assertPatternExists('api/v1/ai-insights/')

class SyncRegistryTests(SimpleTestCase):
    """Ensure that sync‑able apps have registered their models in the central registry."""

    def test_required_registrations(self):
        required = ['grades', 'attendances', 'enrollments', 'courses']
        for table in required:
            self.assertTrue(
                registry.is_registered(table),
                f"Sync registry missing registration for '{table}'."
            )
