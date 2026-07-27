"""
Ré-exporte les ViewSets définis dans chaque sous-module pour garder
un point d'import unique `projects.views`, tout en gardant les
fichiers sources courts et lisibles par sous-module.
"""

from apps.projects.views_business_plan import BusinessPlanViewSet
from apps.projects.views_internships import CompanyViewSet, InternshipViewSet
from apps.projects.views_mentorship import MentorshipViewSet
from apps.projects.views_projects import ProjectViewSet

__all__ = [
    "ProjectViewSet",
    "CompanyViewSet",
    "InternshipViewSet",
    "MentorshipViewSet",
    "BusinessPlanViewSet",
]
