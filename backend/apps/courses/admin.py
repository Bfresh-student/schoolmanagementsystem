from django.contrib import admin

from .models import Course, CourseCoTeacher, CoursePrerequisite, CourseSyllabusVersion


class CourseCoTeacherInline(admin.TabularInline):
    model = CourseCoTeacher
    extra = 0


class CoursePrerequisiteInline(admin.TabularInline):
    model = CoursePrerequisite
    fk_name = "course"
    extra = 0


class CourseSyllabusVersionInline(admin.TabularInline):
    model = CourseSyllabusVersion
    extra = 0
    readonly_fields = ("published_at",)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "name",
        "specialization",
        "teacher",
        "status",
        "seats_taken",
        "seats_available",
        "synced",
    )
    list_filter = ("status", "specialization", "synced")
    search_fields = ("code", "name")
    inlines = [CourseCoTeacherInline, CoursePrerequisiteInline, CourseSyllabusVersionInline]
    readonly_fields = ("created_at", "updated_at")
