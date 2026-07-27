from django.contrib import admin

from apps.projects.models import (
    BusinessPlan,
    BusinessPlanPresentation,
    Company,
    Internship,
    InternshipLog,
    Mentorship,
    MentorshipSession,
    Project,
    ProjectDeliverable,
    ProjectMember,
)


class ProjectMemberInline(admin.TabularInline):
    model = ProjectMember
    extra = 0


class ProjectDeliverableInline(admin.TabularInline):
    model = ProjectDeliverable
    extra = 0


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "course", "teacher", "status", "final_grade", "members_count")
    list_filter = ("status", "course")
    search_fields = ("name",)
    inlines = [ProjectMemberInline, ProjectDeliverableInline]
    readonly_fields = ("created_at", "updated_at")


class InternshipLogInline(admin.TabularInline):
    model = InternshipLog
    extra = 0


@admin.register(Internship)
class InternshipAdmin(admin.ModelAdmin):
    list_display = ("student_id", "company", "mentor", "start_date", "end_date", "status")
    list_filter = ("status", "company")
    inlines = [InternshipLogInline]
    readonly_fields = ("created_at", "updated_at")


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "sector", "contact_email")
    search_fields = ("name", "sector")


class MentorshipSessionInline(admin.TabularInline):
    model = MentorshipSession
    extra = 0


@admin.register(Mentorship)
class MentorshipAdmin(admin.ModelAdmin):
    list_display = ("student_id", "teacher", "start_date", "status")
    list_filter = ("status",)
    inlines = [MentorshipSessionInline]


class BusinessPlanPresentationInline(admin.TabularInline):
    model = BusinessPlanPresentation
    extra = 0


@admin.register(BusinessPlan)
class BusinessPlanAdmin(admin.ModelAdmin):
    list_display = ("business_name", "student_id", "status", "final_grade")
    list_filter = ("status",)
    search_fields = ("business_name",)
    inlines = [BusinessPlanPresentationInline]
    readonly_fields = ("created_at", "updated_at")
