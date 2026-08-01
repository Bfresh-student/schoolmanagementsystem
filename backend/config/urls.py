from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/auth/', include('apps.users.urls')),
    path('api/v1/dashboard/', include('apps.dashboard.urls')),
    
    path('api/v1/students/', include('apps.students.urls')),
    path('api/v1/teachers/', include('apps.teachers.urls')),
    path('api/v1/courses/', include('apps.courses.urls')),
    path('api/v1/grades/', include('apps.grades.urls')),
    path('api/v1/attendances/', include('apps.attendances.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/projects/', include('apps.projects.urls')),
    path('api/v1/events/', include('apps.events.urls')),
    path('api/v1/enrollments/', include('apps.enrollments.urls')),
    path('api/v1/finance/', include('apps.finance.urls')),
    path("api/v1/hr/", include("apps.hr.urls")),
    path("api/v1/payments/", include("apps.payments.urls")),
    path("api/v1/media-center/", include("apps.media_center.urls")),
    path("api/v1/ai-insights/", include("apps.ai_insights.urls")),
    # path('api/v1/library/', include('apps.library.urls')),
    # path('api/v1/reports/', include('apps.reports.urls')),
    # path('api/v1/settings/', include('apps.settings.urls')),
]
