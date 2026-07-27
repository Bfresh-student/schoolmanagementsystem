from django.contrib import admin
from .models import (
    Teacher, TeacherQualification, TeacherSpecialty, TeacherSchedule,
    TeacherAttendance, TeacherPerformanceReview, TeacherLeaveRequest,
    TeacherCertification
)
 
 
@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = (
        'full_name', 'teacher_id', 'employment_type', 'status',
        'rating', 'hire_date'
    )
    list_filter = ('status', 'employment_type', 'hire_date')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'teacher_id')
    readonly_fields = ('rating', 'rating_count', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Utilisateur', {'fields': ('user',)}),
        ('Emploi', {'fields': ('teacher_id', 'employment_type', 'hire_date', 'status')}),
        ('Salaire', {'fields': ('salary_grade', 'monthly_salary')}),
        ('Contact d\'urgence', {'fields': ('emergency_contact_name', 'emergency_contact_phone')}),
        ('Bureau', {'fields': ('office_location', 'office_phone')}),
        ('Biographie', {'fields': ('bio',)}),
        ('Assurance', {'fields': ('health_insurance_number',)}),
        ('Évaluation', {'fields': ('rating', 'rating_count')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
 
 
@admin.register(TeacherQualification)
class TeacherQualificationAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'qualification_type', 'field_of_study', 'graduation_year')
    list_filter = ('qualification_type', 'graduation_year')
    search_fields = ('teacher__user__email', 'field_of_study')
 
 
@admin.register(TeacherSpecialty)
class TeacherSpecialtyAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'subject', 'level', 'certification_level', 'is_primary')
    list_filter = ('level', 'certification_level', 'is_primary')
    search_fields = ('teacher__user__email', 'subject')
 
 
@admin.register(TeacherSchedule)
class TeacherScheduleAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'day_of_week', 'start_time', 'end_time', 'activity', 'is_active')
    list_filter = ('day_of_week', 'activity', 'is_active')
    search_fields = ('teacher__user__email',)
 
 
@admin.register(TeacherAttendance)
class TeacherAttendanceAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'date', 'is_present', 'absence_type')
    list_filter = ('is_present', 'absence_type', 'date')
    search_fields = ('teacher__user__email',)
 
 
@admin.register(TeacherPerformanceReview)
class TeacherPerformanceReviewAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'review_date', 'review_period', 'overall_rating', 'reviewer')
    list_filter = ('review_period', 'review_date')
    search_fields = ('teacher__user__email', 'reviewer__email')
    readonly_fields = ('overall_rating', 'created_at')
 
 
@admin.register(TeacherLeaveRequest)
class TeacherLeaveRequestAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'leave_type', 'start_date', 'end_date', 'status', 'approved_by')
    list_filter = ('leave_type', 'status', 'start_date')
    search_fields = ('teacher__user__email',)
 
 
@admin.register(TeacherCertification)
class TeacherCertificationAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'name', 'issuing_body', 'issue_date', 'is_expired')
    list_filter = ('issue_date', 'expiration_date')
    search_fields = ('teacher__user__email', 'name')